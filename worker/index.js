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
  constructor(state) {
    this.state = state;
    this.sessions = new Map();
    this.server = "unknown";
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/status") {
      return Response.json({ server: this.server, online: this.sessions.size, capacity: MAX_PLAYERS });
    }
    if (request.headers.get("Upgrade") !== "websocket") return new Response("WebSocket upgrade required", { status: 426 });
    const server = url.pathname.split("/").pop();
    if (!SERVERS.has(server)) return new Response("Unknown server", { status: 404 });
    this.server = server;
    const pair = new WebSocketPair();
    const client = pair[0], socket = pair[1];
    const id = crypto.randomUUID();
    const name = (url.searchParams.get("name") || "لاعب").trim().slice(0, 20) || "لاعب";
    if (this.sessions.size >= MAX_PLAYERS) {
      socket.accept();
      socket.send(JSON.stringify({ type: "error", code: "SERVER_FULL", message: "السيرفر ممتلئ" }));
      socket.close(1013, "Server full");
      return new Response(null, { status: 101, webSocket: client });
    }
    socket.accept();
    const player = { id, name, x: 0, z: 0, yaw: 0, lastMove: 0, server };
    this.sessions.set(socket, player);
    socket.addEventListener("message", event => this.onMessage(socket, event.data));
    socket.addEventListener("close", () => this.onClose(socket));
    socket.addEventListener("error", () => this.onClose(socket));
    socket.send(JSON.stringify({ type: "welcome", id, server, online: this.sessions.size, capacity: MAX_PLAYERS }));
    const players = [...this.sessions.entries()].filter(([s]) => s !== socket).map(([, p]) => this.publicPlayer(p));
    socket.send(JSON.stringify({ type: "snapshot", players }));
    this.broadcast({ type: "player_joined", player: this.publicPlayer(player), online: this.sessions.size }, socket);
    return new Response(null, { status: 101, webSocket: client });
  }

  publicPlayer(p) {
    return { id: p.id, name: p.name, x: p.x, z: p.z, yaw: p.yaw };
  }

  broadcast(message, except = null) {
    const data = JSON.stringify(message);
    for (const socket of this.sessions.keys()) {
      if (socket === except) continue;
      try { socket.send(data); } catch { this.sessions.delete(socket); }
    }
  }

  onMessage(socket, raw) {
    const player = this.sessions.get(socket);
    if (!player) return;
    let data;
    try { data = JSON.parse(raw); } catch { return; }
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

  onClose(socket) {
    const player = this.sessions.get(socket);
    if (!player) return;
    this.sessions.delete(socket);
    this.broadcast({ type: "player_left", id: player.id, online: this.sessions.size });
  }
}
