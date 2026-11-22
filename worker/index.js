const SERVERS = new Set(["ME1", "ME2", "ME3"]);
const MAX_PLAYERS = 100;
const WORLD_LIMIT = 250;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return Response.json({ status: "ok", service: "onestate-realtime", servers: [...SERVERS], capacityPerServer: MAX_PLAYERS });
    }
    if (url.pathname === "/api/servers") {
      const counts = await Promise.all([...SERVERS].map(async server => {
        const id = env.GAME_ROOMS.idFromName(server);
        const response = await env.GAME_ROOMS.get(id).fetch("https://room.internal/status");
        return response.json();
      }));
      return Response.json({ servers: counts });
    }
    const match = url.pathname.match(/^\/ws\/(ME[123])$/);
    if (match) {
      if (request.headers.get("Upgrade") !== "websocket") return new Response("WebSocket upgrade required", { status: 426 });
      const id = env.GAME_ROOMS.idFromName(match[1]);
      return env.GAME_ROOMS.get(id).fetch(request);
    }
    return new Response("OneState realtime service", { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
};

export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/status") {
      const players = [...this.sessions.values()].map(p => ({ id: p.id, name: p.name, x: p.x, z: p.z, yaw: p.yaw }));
      return Response.json({ server: this.state.id?.name || "room", online: players.length, capacity: MAX_PLAYERS, players });
    }
    if (request.headers.get("Upgrade") !== "websocket") return new Response("WebSocket upgrade required", { status: 426 });
    const server = url.pathname.split("/").pop();
    if (!SERVERS.has(server)) return new Response("Unknown server", { status: 404 });
    const pair = new WebSocketPair();
    const client = pair[0], socket = pair[1];
    socket.accept();
    const id = crypto.randomUUID();
    const name = (url.searchParams.get("name") || "لاعب").trim().slice(0, 20) || "لاعب";
    if (this.sessions.size >= MAX_PLAYERS) {
      socket.send(JSON.stringify({ type: "error", code: "SERVER_FULL", message: "السيرفر ممتلئ" }));
      socket.close(1013, "Server full");
      return new Response(null, { status: 101, webSocket: client });
    }
    this.sessions.set(socket, { id, name, x: 0, z: 36, yaw: 0, lastMove: 0, server });
    socket.send(JSON.stringify({ type: "welcome", id, server, online: this.sessions.size, capacity: MAX_PLAYERS }));
    this.broadcast({ type: "player_joined", player: this.publicPlayer(this.sessions.get(socket)) }, socket);
    this.sendSnapshot(socket);
    return new Response(null, { status: 101, webSocket: client });
  }

  publicPlayer(p) {
    return { id: p.id, name: p.name, x: p.x, z: p.z, yaw: p.yaw };
  }

  sendSnapshot(socket) {
    const players = [...this.sessions.entries()].filter(([s]) => s !== socket).map(([, p]) => this.publicPlayer(p));
    socket.send(JSON.stringify({ type: "snapshot", players }));
  }

  broadcast(message, except = null) {
    const data = JSON.stringify(message);
    for (const socket of this.sessions.keys()) {
      if (socket === except) continue;
      try { socket.send(data); } catch { this.sessions.delete(socket); }
    }
  }

  async webSocketMessage(socket, message) {
    const player = this.sessions.get(socket);
    if (!player) return;
    let data;
    try { data = JSON.parse(message); } catch { return; }
    if (data.type !== "move") return;
    const now = Date.now();
    if (now - player.lastMove < 45) return;
    player.lastMove = now;
    const x = Number(data.x), z = Number(data.z), yaw = Number(data.yaw);
    if (![x, z, yaw].every(Number.isFinite)) return;
    player.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, x));
    player.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, z));
    player.yaw = Math.max(-Math.PI * 4, Math.min(Math.PI * 4, yaw));
    this.broadcast({ type: "player_moved", player: this.publicPlayer(player) }, socket);
  }

  async webSocketClose(socket) {
    const player = this.sessions.get(socket);
    if (!player) return;
    this.sessions.delete(socket);
    this.broadcast({ type: "player_left", id: player.id, online: this.sessions.size });
  }

  async webSocketError(socket) {
    await this.webSocketClose(socket);
  }
}
