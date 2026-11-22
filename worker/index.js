const SERVERS = new Set(["ME1", "ME2", "ME3"]);
const MAX_PLAYERS = 100;
const WORLD_LIMIT = 350;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return Response.json({ status: "ok", service: "onestate-realtime", servers: [...SERVERS], capacityPerServer: MAX_PLAYERS });
    }
    if (url.pathname.startsWith("/api/auth/") || url.pathname === "/api/profile" || url.pathname === "/api/profile/job" || url.pathname === "/api/jobs") {
      const id = env.ACCOUNT_STORE.idFromName("global-accounts");
      return env.ACCOUNT_STORE.get(id).fetch(request);
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
      const token = url.searchParams.get("token");
      if (!token) return new Response("Authentication required", { status: 401 });
      const accountId = env.ACCOUNT_STORE.idFromName("global-accounts");
      const authResponse = await env.ACCOUNT_STORE.get(accountId).fetch(new Request("https://accounts.internal/api/auth/resolve", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      }));
      if (!authResponse.ok) return new Response("Session expired. Please sign in again.", { status: 401 });
      const identity = await authResponse.json();
      const headers = new Headers(request.headers);
      headers.set("X-Player-Id", identity.id);
      headers.set("X-Player-Name", identity.displayName);
      const authenticatedRequest = new Request(request, { headers });
      const id = env.GAME_ROOMS.idFromName(match[1]);
      return env.GAME_ROOMS.get(id).fetch(authenticatedRequest);
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
    const id = request.headers.get("X-Player-Id") || crypto.randomUUID();
    const name = (request.headers.get("X-Player-Name") || url.searchParams.get("name") || "لاعب").trim().slice(0, 20) || "لاعب";
    if (this.sessions.size >= MAX_PLAYERS) {
      socket.accept();
      socket.send(JSON.stringify({ type: "error", code: "SERVER_FULL", message: "السيرفر ممتلئ" }));
      socket.close(1013, "Server full");
      return new Response(null, { status: 101, webSocket: client });
    }
    socket.accept();
    const player = { id, name, x: 0, z: 0, yaw: 0, lastMove: Date.now(), server };
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
    const elapsedMs = now - player.lastMove;
    if (elapsedMs < 45) return;
    const x = Number(data.x), z = Number(data.z), yaw = Number(data.yaw);
    if (![x, z, yaw].every(Number.isFinite)) return;
    const targetX = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, x));
    const targetZ = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, z));
    const dx = targetX - player.x, dz = targetZ - player.z;
    const distance = Math.hypot(dx, dz);
    const elapsed = Math.min(.5, Math.max(.045, elapsedMs / 1000));
    const maxStep = 42 * elapsed + 1.75;
    if (distance > maxStep) {
      const scale = maxStep / distance;
      player.x += dx * scale;
      player.z += dz * scale;
    } else {
      player.x = targetX;
      player.z = targetZ;
    }
    player.lastMove = now;
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


const AUTH_JOBS = [
  { id: "citizen", name: "مواطن", description: "ابدأ حياتك في المدينة" },
  { id: "police", name: "الشرطة", description: "حماية المدينة وتطبيق القانون" },
  { id: "medic", name: "الإسعاف", description: "إنقاذ المصابين ونقلهم للمستشفى" },
  { id: "mechanic", name: "ميكانيكي", description: "صيانة المركبات وإصلاحها" },
  { id: "taxi", name: "سائق أجرة", description: "نقل الركاب بين أحياء المدينة" },
  { id: "bus", name: "سائق حافلة", description: "تشغيل خطوط النقل العام" },
  { id: "delivery", name: "التوصيل", description: "توصيل الطلبات إلى السكان" }
];
const AUTH_CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
  "access-control-max-age": "86400"
};
const AUTH_ENCODER = new TextEncoder();
function authReply(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...AUTH_CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
function toHex(bytes) {
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
async function passwordHash(password, saltHex) {
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(x => parseInt(x, 16)));
  const key = await crypto.subtle.importKey("raw", AUTH_ENCODER.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, 256);
  return toHex(bits);
}
function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function publicAccount(account) {
  return {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    cash: account.cash,
    job: account.job,
    level: account.level,
    xp: account.xp
  };
}
export class AccountStore {
  constructor(state) {
    this.state = state;
    this.storage = state.storage;
  }

  async userFromRequest(request) {
    const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return null;
    const session = await this.storage.get("session:" + token);
    if (!session || session.expiresAt < Date.now()) {
      if (session) await this.storage.delete("session:" + token);
      return null;
    }
    const username = await this.storage.get("id:" + session.id);
    if (!username) return null;
    return await this.storage.get("user:" + username);
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: AUTH_CORS });
    if (url.pathname === "/api/jobs" && request.method === "GET") return authReply({ jobs: AUTH_JOBS });
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      const username = String(body?.username || "").trim();
      const displayName = String(body?.displayName || username).trim().slice(0, 20);
      const password = String(body?.password || "");
      if (!/^[\p{L}\p{N}_]{3,20}$/u.test(username)) return authReply({ error: "اسم الحساب يجب أن يكون 3 إلى 20 حرفاً أو رقماً أو _" }, 400);
      if (password.length < 8 || password.length > 128) return authReply({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, 400);
      if (!displayName) return authReply({ error: "اكتب اسم ظهور صالحاً" }, 400);
      const normalized = username.toLowerCase();
      const key = "user:" + normalized;
      if (await this.storage.get(key)) return authReply({ error: "اسم الحساب مستخدم بالفعل" }, 409);
      const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
      const account = {
        id: crypto.randomUUID(),
        username: normalized,
        displayName,
        passwordSalt: salt,
        passwordHash: await passwordHash(password, salt),
        cash: 2500,
        job: "citizen",
        level: 1,
        xp: 0,
        createdAt: Date.now()
      };
      await this.storage.put(key, account);
      await this.storage.put("id:" + account.id, normalized);
      const token = crypto.randomUUID() + crypto.randomUUID();
      await this.storage.put("session:" + token, { id: account.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
      return authReply({ token, account: publicAccount(account) }, 201);
    }
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      const username = String(body?.username || "").trim().toLowerCase();
      const password = String(body?.password || "");
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const minute = Math.floor(Date.now() / 60000);
      const attemptKey = `login-attempt:${ip}:${minute}`;
      const attempts = (await this.storage.get(attemptKey)) || 0;
      if (attempts >= 12) return authReply({ error: "محاولات كثيرة، انتظر دقيقة ثم حاول مجدداً" }, 429);
      await this.storage.put(attemptKey, attempts + 1, { expirationTtl: 120 });
      const account = await this.storage.get("user:" + username);
      if (!account) return authReply({ error: "بيانات الدخول غير صحيحة" }, 401);
      const candidate = await passwordHash(password, account.passwordSalt);
      if (!constantTimeEqual(candidate, account.passwordHash)) return authReply({ error: "بيانات الدخول غير صحيحة" }, 401);
      const token = crypto.randomUUID() + crypto.randomUUID();
      await this.storage.put("session:" + token, { id: account.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
      return authReply({ token, account: publicAccount(account) });
    }
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
      if (token) await this.storage.delete("session:" + token);
      return authReply({ ok: true });
    }
    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const account = await this.userFromRequest(request);
      return account ? authReply({ account: publicAccount(account) }) : authReply({ error: "انتهت الجلسة" }, 401);
    }
    if (url.pathname === "/api/auth/resolve" && request.method === "POST") {
      const account = await this.userFromRequest(request);
      return account ? authReply(publicAccount(account)) : authReply({ error: "انتهت الجلسة" }, 401);
    }
    if (url.pathname === "/api/profile" && request.method === "GET") {
      const account = await this.userFromRequest(request);
      return account ? authReply({ account: publicAccount(account) }) : authReply({ error: "سجل الدخول أولاً" }, 401);
    }
    if (url.pathname === "/api/profile/job" && request.method === "POST") {
      const account = await this.userFromRequest(request);
      if (!account) return authReply({ error: "سجل الدخول أولاً" }, 401);
      const body = await request.json().catch(() => null);
      const job = AUTH_JOBS.find(item => item.id === body?.job);
      if (!job) return authReply({ error: "الوظيفة غير متاحة" }, 400);
      account.job = job.id;
      await this.storage.put("user:" + account.username, account);
      return authReply({ account: publicAccount(account) });
    }
    return authReply({ error: "المسار غير موجود" }, 404);
  }
}
