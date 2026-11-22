const SERVERS = new Set(["ME1", "ME2", "ME3"]);
const MAX_PLAYERS = 100;
const WORLD_LIMIT = 560;
const PLAYER_VISIBILITY_RANGE = 220;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Answer browser CORS preflights at the Worker edge before forwarding to Durable Objects.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...AUTH_CORS, "cache-control": "no-store" } });
    }
    if (url.pathname === "/api/health") {
      return Response.json({ status: "ok", service: "onestate-realtime", servers: [...SERVERS], capacityPerServer: MAX_PLAYERS }, { headers: { "access-control-allow-origin": "*", "cache-control": "no-store" } });
    }
    if (url.pathname === "/api/profile/save-position" && request.method === "POST") {
      const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
      if (!token) return Response.json({ error: "سجل الدخول أولاً" }, { status: 401, headers: AUTH_CORS });
      const body = await request.clone().json().catch(() => null);
      const server = body?.server;
      if (!SERVERS.has(server) || (request.headers.get("X-Game-Server") && request.headers.get("X-Game-Server") !== server)) return Response.json({ error: "اختر سيرفراً صالحاً" }, { status: 400, headers: AUTH_CORS });
      const accountId = env.ACCOUNT_STORE.idFromName("global-accounts");
      const accountStore = env.ACCOUNT_STORE.get(accountId);
      const auth = await accountStore.fetch(new Request("https://accounts.internal/api/auth/resolve", { method: "POST", headers: { Authorization: "Bearer " + token, "X-Game-Server": server } }));
      if (!auth.ok) return Response.json({ error: "انتهت الجلسة" }, { status: 401, headers: AUTH_CORS });
      const identity = await auth.json();
      const roomId = env.GAME_ROOMS.idFromName(server);
      const positionResponse = await env.GAME_ROOMS.get(roomId).fetch("https://room.internal/player-position/" + encodeURIComponent(identity.id));
      if (!positionResponse.ok) return Response.json({ error: "يجب أن تكون متصلاً لحفظ موقعك" }, { status: 409, headers: AUTH_CORS });
      const position = await positionResponse.json();
      const headers = new Headers(request.headers);
      headers.set("X-Player-X", String(position.x));
      headers.set("X-Player-Z", String(position.z));
      headers.set("X-Player-Server", server);
      return accountStore.fetch(new Request(request, { headers }));
    }
    if (url.pathname === "/api/missions/complete" && request.method === "POST") {
      const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
      if (!token) return Response.json({ error: "سجل الدخول أولاً" }, { status: 401, headers: AUTH_CORS });
      const body = await request.clone().json().catch(() => null);
      const server = body?.server;
      if (!SERVERS.has(server) || (request.headers.get("X-Game-Server") && request.headers.get("X-Game-Server") !== server)) return Response.json({ error: "اختر سيرفراً صالحاً" }, { status: 400, headers: AUTH_CORS });
      const accountId = env.ACCOUNT_STORE.idFromName("global-accounts");
      const accountStore = env.ACCOUNT_STORE.get(accountId);
      const auth = await accountStore.fetch(new Request("https://accounts.internal/api/auth/resolve", { method: "POST", headers: { Authorization: "Bearer " + token, "X-Game-Server": server } }));
      if (!auth.ok) return Response.json({ error: "انتهت الجلسة" }, { status: 401, headers: AUTH_CORS });
      const identity = await auth.json();
      const roomId = env.GAME_ROOMS.idFromName(server);
      const positionResponse = await env.GAME_ROOMS.get(roomId).fetch("https://room.internal/player-position/" + encodeURIComponent(identity.id));
      if (!positionResponse.ok) return Response.json({ error: "يجب أن تكون متصلاً بالسيرفر لإكمال المهمة" }, { status: 409, headers: AUTH_CORS });
      const position = await positionResponse.json();
      const headers = new Headers(request.headers);
      headers.set("X-Player-X", String(position.x));
      headers.set("X-Player-Z", String(position.z));
      headers.set("X-Player-Server", server);
      return accountStore.fetch(new Request(request, { headers }));
    }
    if (url.pathname.startsWith("/api/auth/") || url.pathname === "/api/profile" || url.pathname === "/api/profile/job" || url.pathname === "/api/profile/save-position" || url.pathname === "/api/jobs" || url.pathname.startsWith("/api/missions")) {
      const id = env.ACCOUNT_STORE.idFromName("global-accounts");
      return env.ACCOUNT_STORE.get(id).fetch(request);
    }
    if (url.pathname === "/api/servers") {
      const counts = await Promise.all([...SERVERS].map(async server => {
        const id = env.GAME_ROOMS.idFromName(server);
        const response = await env.GAME_ROOMS.get(id).fetch("https://room.internal/status");
        const status = await response.json();
        return { ...status, server };
      }));
      return Response.json({ servers: counts }, { headers: { "access-control-allow-origin": "*", "cache-control": "no-store" } });
    }
    const match = url.pathname.match(/^\/ws\/(ME[123])$/);
    if (match) {
      if (request.headers.get("Upgrade") !== "websocket") return new Response("WebSocket upgrade required", { status: 426 });
      const token = url.searchParams.get("token");
      if (!token) return Response.json({ error: "سجل الدخول أولاً" }, { status: 401, headers: AUTH_CORS });
      const accountId = env.ACCOUNT_STORE.idFromName("global-accounts");
      const authResponse = await env.ACCOUNT_STORE.get(accountId).fetch(new Request("https://accounts.internal/api/auth/resolve", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "X-Game-Server": match[1] }
      }));
      if (!authResponse.ok) return new Response("Session expired. Please sign in again.", { status: 401 });
      const identity = await authResponse.json();
      const headers = new Headers(request.headers);
      headers.set("X-Player-Id", identity.id);
      headers.set("X-Player-Name", identity.displayName);
      headers.set("X-Player-Spawn-X", String(identity.spawnX || 0));
      headers.set("X-Player-Spawn-Z", String(identity.spawnZ || 0));
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
    this.visiblePlayers = new Map();
    this.server = "unknown";
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/status") {
      return Response.json({ server: this.server, online: this.sessions.size, capacity: MAX_PLAYERS });
    }
    const positionMatch = url.pathname.match(/^\/player-position\/([^/]+)$/);
    if (positionMatch) {
      const player = [...this.sessions.values()].find(item => item.id === decodeURIComponent(positionMatch[1]));
      return player ? Response.json({ x: player.x, z: player.z, server: player.server }) : Response.json({ error: "player_offline" }, { status: 404 });
    }
    if (request.headers.get("Upgrade") !== "websocket") return new Response("WebSocket upgrade required", { status: 426 });
    const server = url.pathname.split("/").pop();
    if (!SERVERS.has(server)) return new Response("Unknown server", { status: 404 });
    this.server = server;
    const pair = new WebSocketPair();
    const client = pair[0], socket = pair[1];
    const id = request.headers.get("X-Player-Id") || crypto.randomUUID();
    const name = (request.headers.get("X-Player-Name") || url.searchParams.get("name") || "لاعب").trim().slice(0, 20) || "لاعب";
    for (const [existingSocket, existingPlayer] of this.sessions) {
      if (existingPlayer.id === id) {
        try { existingSocket.close(4001, "Account reconnected"); } catch {}
        this.onClose(existingSocket);
      }
    }
    if (this.sessions.size >= MAX_PLAYERS) {
      socket.accept();
      socket.send(JSON.stringify({ type: "error", code: "SERVER_FULL", message: "السيرفر ممتلئ" }));
      socket.close(1013, "Server full");
      return new Response(null, { status: 101, webSocket: client });
    }
    socket.accept();
    const spawnX = Number(request.headers.get("X-Player-Spawn-X")) || 0;
    const spawnZ = Number(request.headers.get("X-Player-Spawn-Z")) || 0;
    const player = { id, name, x: Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, spawnX)), z: Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, spawnZ)), yaw: 0, running: false, lastMove: Date.now(), lastChat: 0, server };
    this.sessions.set(socket, player);
    socket.addEventListener("message", event => this.onMessage(socket, event.data));
    socket.addEventListener("close", () => this.onClose(socket));
    socket.addEventListener("error", () => this.onClose(socket));
    const nearby = [...this.sessions.entries()].filter(([s, p]) => s !== socket && Math.hypot(p.x-player.x,p.z-player.z) <= PLAYER_VISIBILITY_RANGE);
    this.visiblePlayers.set(socket, new Set(nearby.map(([, p]) => p.id)));
    socket.send(JSON.stringify({ type: "welcome", id, server, online: this.sessions.size, capacity: MAX_PLAYERS }));
    socket.send(JSON.stringify({ type: "snapshot", players: nearby.map(([, p]) => this.publicPlayer(p)) }));
    for (const [otherSocket, otherPlayer] of this.sessions) {
      if (otherSocket === socket) continue;
      if (Math.hypot(otherPlayer.x-player.x,otherPlayer.z-player.z) <= PLAYER_VISIBILITY_RANGE) {
        const visible = this.visiblePlayers.get(otherSocket) || new Set();
        visible.add(player.id);
        this.visiblePlayers.set(otherSocket, visible);
        try { otherSocket.send(JSON.stringify({ type: "player_joined", player: this.publicPlayer(player), online: this.sessions.size })); } catch {}
      }
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  publicPlayer(p) {
    return { id: p.id, name: p.name, x: p.x, z: p.z, yaw: p.yaw, running: Boolean(p.running) };
  }

  broadcast(message, except = null) {
    const data = JSON.stringify(message);
    for (const socket of this.sessions.keys()) {
      if (socket === except) continue;
      try { socket.send(data); } catch { this.onClose(socket); }
    }
  }

  broadcastMovement(player, sourceSocket) {
    const online = this.sessions.size;
    const moved = this.publicPlayer(player);
    const ownVisible = this.visiblePlayers.get(sourceSocket) || new Set();
    for (const [otherSocket, otherPlayer] of this.sessions) {
      if (otherSocket === sourceSocket) continue;
      const inRange = Math.hypot(otherPlayer.x-player.x,otherPlayer.z-player.z) <= PLAYER_VISIBILITY_RANGE;
      if (inRange && !ownVisible.has(otherPlayer.id)) {
        ownVisible.add(otherPlayer.id);
        try { sourceSocket.send(JSON.stringify({ type: "player_joined", player: this.publicPlayer(otherPlayer), online })); } catch {}
      } else if (!inRange && ownVisible.delete(otherPlayer.id)) {
        try { sourceSocket.send(JSON.stringify({ type: "player_left", id: otherPlayer.id, online })); } catch {}
      }
    }
    this.visiblePlayers.set(sourceSocket, ownVisible);
    for (const [socket, recipient] of this.sessions) {
      if (socket === sourceSocket) continue;
      const visible = this.visiblePlayers.get(socket) || new Set();
      const inRange = Math.hypot(recipient.x-player.x,recipient.z-player.z) <= PLAYER_VISIBILITY_RANGE;
      if (inRange) {
        const type = visible.has(player.id) ? "player_moved" : "player_joined";
        visible.add(player.id);
        this.visiblePlayers.set(socket, visible);
        try { socket.send(JSON.stringify(type === "player_joined" ? { type, player: moved, online } : { type, player: moved })); } catch { this.onClose(socket); }
      } else if (visible.delete(player.id)) {
        try { socket.send(JSON.stringify({ type: "player_left", id: player.id, online })); } catch { this.onClose(socket); }
      }
    }
  }

  onMessage(socket, raw) {
    const player = this.sessions.get(socket);
    if (!player) return;
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    if (data.type === "chat") {
      const now = Date.now();
      if (now - player.lastChat < 1400) return;
      const message = String(data.message || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 160);
      if (!message) return;
      player.lastChat = now;
      const payload = JSON.stringify({ type: "chat", playerId: player.id, name: player.name, message, timestamp: now });
      try { socket.send(payload); } catch {}
      const visible = this.visiblePlayers.get(socket) || new Set();
      for (const [recipientSocket, recipient] of this.sessions) {
        if (recipientSocket === socket || !visible.has(recipient.id)) continue;
        try { recipientSocket.send(payload); } catch { this.onClose(recipientSocket); }
      }
      return;
    }
    if (data.type !== "move") return;
    const now = Date.now();
    const elapsedMs = now - player.lastMove;
    if (elapsedMs < 95) return;
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
    player.running = Boolean(data.running);
    this.broadcastMovement(player, socket);
  }

  onClose(socket) {
    const player = this.sessions.get(socket);
    if (!player) return;
    this.sessions.delete(socket);
    this.visiblePlayers.delete(socket);
    const online = this.sessions.size;
    for (const [recipientSocket, visible] of this.visiblePlayers) {
      if (visible.delete(player.id)) {
        try { recipientSocket.send(JSON.stringify({ type: "player_left", id: player.id, online })); } catch {}
      }
    }
  }
}


const AUTH_MISSIONS = [
  { id: "citizen_walk", job: "citizen", title: "جولة في وسط المدينة", description: "توجه إلى ساحة المدينة", destination: { x: -54, z: -75 }, reward: 180, xp: 35, minSeconds: 20 },
  { id: "police_patrol", job: "police", title: "دورية أمنية", description: "توجه إلى الحديقة الغربية", destination: { x: -175, z: 35 }, reward: 350, xp: 70, minSeconds: 30 },
  { id: "medical_call", job: "medic", title: "استجابة طبية", description: "توجه إلى مدخل المستشفى", destination: { x: -54, z: 82 }, reward: 420, xp: 85, minSeconds: 30 },
  { id: "army_checkpoint", job: "army", title: "تفقد نقطة الحراسة", description: "توجه إلى بوابة القاعدة العسكرية", destination: { x: 420, z: 430 }, reward: 520, xp: 100, minSeconds: 40 },
  { id: "fbi_investigation", job: "fbi", title: "تحقيق فيدرالي", description: "توجه إلى المقر الفيدرالي", destination: { x: 385, z: -365 }, reward: 560, xp: 110, minSeconds: 40 },
  { id: "council_service", job: "council", title: "خدمة بلدية", description: "توجه إلى مجلس المدينة", destination: { x: -54, z: -32 }, reward: 450, xp: 90, minSeconds: 35 },
  { id: "repair_call", job: "mechanic", title: "طلب صيانة", description: "توجه إلى محطة الوقود", destination: { x: 105, z: -15 }, reward: 320, xp: 65, minSeconds: 25 },
  { id: "taxi_trip", job: "taxi", title: "رحلة أجرة", description: "أوصل الراكب إلى الحي التجاري", destination: { x: 125, z: -85 }, reward: 330, xp: 65, minSeconds: 30 },
  { id: "bus_route", job: "bus", title: "خط الحافلة", description: "توجه إلى نهاية الخط الشمالي", destination: { x: 0, z: 280 }, reward: 500, xp: 100, minSeconds: 45 },
  { id: "delivery_run", job: "delivery", title: "توصيل طلب", description: "وصل الطلب إلى السوبرماركت", destination: { x: 125, z: -85 }, reward: 360, xp: 70, minSeconds: 30 }
];
const AUTH_JOBS = [
  { id: "citizen", name: "مواطن", description: "ابدأ حياتك في المدينة" },
  { id: "police", name: "الشرطة", description: "حماية المدينة وتطبيق القانون" },
  { id: "medic", name: "المستشفى والإسعاف", description: "إنقاذ المصابين وتشغيل الخدمات الطبية" },
  { id: "army", name: "الجيش", description: "حماية القاعدة والمنشآت الاستراتيجية" },
  { id: "fbi", name: "FBI", description: "التحقيقات الفيدرالية والمهام الخاصة" },
  { id: "council", name: "مجلس المدينة", description: "إدارة الخدمات والمهام البلدية" },
  { id: "mechanic", name: "ميكانيكي", description: "صيانة المركبات وإصلاحها" },
  { id: "taxi", name: "سائق أجرة", description: "نقل الركاب بين أحياء المدينة" },
  { id: "bus", name: "سائق حافلة", description: "تشغيل خطوط النقل العام" },
  { id: "delivery", name: "التوصيل", description: "توصيل الطلبات إلى السكان" }
];
const AUTH_CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-game-server",
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
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return toHex(bits);
}
function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function defaultServerProfile() {
  return { cash: 2500, job: "citizen", level: 1, xp: 0, spawnX: 0, spawnZ: 0, activeMission: null };
}
function ensureServerProfiles(account) {
  if (account.serverProfiles) return false;
  const previousServer = SERVERS.has(account.lastServer) ? account.lastServer : "ME1";
  const legacy = {
    cash: Number(account.cash) || 2500,
    job: AUTH_JOBS.some(job => job.id === account.job) ? account.job : "citizen",
    level: Math.max(1, Number(account.level) || 1),
    xp: Math.max(0, Number(account.xp) || 0),
    spawnX: Number(account.spawnX) || 0,
    spawnZ: Number(account.spawnZ) || 0,
    activeMission: account.activeMission || null
  };
  account.serverProfiles = {};
  for (const server of SERVERS) account.serverProfiles[server] = server === previousServer ? legacy : defaultServerProfile();
  return true;
}
function publicAccount(account, server = "ME1") {
  const selected = SERVERS.has(server) ? server : "ME1";
  const profile = account.serverProfiles?.[selected] || defaultServerProfile();
  return { id: account.id, username: account.username, displayName: account.displayName, server: selected,
    cash: profile.cash, job: profile.job, level: profile.level, xp: profile.xp,
    spawnX: Number(profile.spawnX) || 0, spawnZ: Number(profile.spawnZ) || 0 };
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
    const account = await this.storage.get("user:" + username);
    if (!account) return null;
    if (ensureServerProfiles(account)) await this.storage.put("user:" + username, account);
    return account;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: AUTH_CORS });
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 8192) return authReply({ error: "الطلب كبير جداً" }, 413);
    if (url.pathname === "/api/jobs" && request.method === "GET") return authReply({ jobs: AUTH_JOBS });
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const registerWindow = Math.floor(Date.now() / 600000);
      // Count successful account creations only; invalid/duplicate attempts must not lock out a player.
      const registerKey = `register-success-v2:${ip}`;
      const registerState = await this.storage.get(registerKey);
      const registerAttempts = registerState?.window === registerWindow ? registerState.count : 0;
      const body = await request.json().catch(() => null);
      const username = String(body?.username || "").trim();
      const displayName = String(body?.displayName || username).trim().slice(0, 20);
      const password = String(body?.password || "");
      if (!/^[\p{L}\p{N}_]{3,20}$/u.test(username)) return authReply({ error: "اسم الحساب يجب أن يكون 3 إلى 20 حرفاً أو رقماً أو _" }, 400);
      if (password.length < 8 || password.length > 128) return authReply({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, 400);
      if (!displayName) return authReply({ error: "اكتب اسم ظهور صالحاً" }, 400);
      const normalized = username.toLowerCase();
      const key = "user:" + normalized;
      const existing = await this.storage.get(key);
      if (existing) return authReply({ error: "اسم الحساب مستخدم بالفعل، جرّب تسجيل الدخول بدلاً من إنشاء حساب جديد" }, 409);
      if (registerAttempts >= 5) return authReply({ error: "تم إنشاء عدد كبير من الحسابات من هذا الاتصال، حاول بعد عشر دقائق" }, 429);
      const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
      const account = {
        id: crypto.randomUUID(),
        username: normalized,
        displayName,
        passwordSalt: salt,
        passwordHash: await passwordHash(password, salt),
        serverProfiles: Object.fromEntries([...SERVERS].map(server => [server, defaultServerProfile()])),
        createdAt: Date.now()
      };
      const token = crypto.randomUUID() + crypto.randomUUID();
      await this.storage.put({
        [key]: account,
        ["id:" + account.id]: normalized,
        ["session:" + token]: { id: account.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }
      });
      await this.storage.put(registerKey, { window: registerWindow, count: registerAttempts + 1 });
      return authReply({ token, account: publicAccount(account, request.headers.get("X-Game-Server")) }, 201);
    }
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      const username = String(body?.username || "").trim().toLowerCase();
      const password = String(body?.password || "");
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const minute = Math.floor(Date.now() / 60000);
      const attemptKey = `login-attempt:${ip}`;
      const attemptState = await this.storage.get(attemptKey);
      const attempts = attemptState?.window === minute ? attemptState.count : 0;
      if (attempts >= 12) return authReply({ error: "محاولات كثيرة، انتظر دقيقة ثم حاول مجدداً" }, 429);
      await this.storage.put(attemptKey, { window: minute, count: attempts + 1 });
      const account = await this.storage.get("user:" + username);
      if (!account) return authReply({ error: "بيانات الدخول غير صحيحة" }, 401);
      const candidate = await passwordHash(password, account.passwordSalt);
      if (!constantTimeEqual(candidate, account.passwordHash)) return authReply({ error: "بيانات الدخول غير صحيحة" }, 401);
      const token = crypto.randomUUID() + crypto.randomUUID();
      await this.storage.put("session:" + token, { id: account.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
      return authReply({ token, account: publicAccount(account, request.headers.get("X-Game-Server")) });
    }
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
      if (token) await this.storage.delete("session:" + token);
      return authReply({ ok: true });
    }
    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const account = await this.userFromRequest(request);
      return account ? authReply({ account: publicAccount(account, request.headers.get("X-Game-Server")) }) : authReply({ error: "انتهت الجلسة" }, 401);
    }
    if (url.pathname === "/api/auth/resolve" && request.method === "POST") {
      const account = await this.userFromRequest(request);
      return account ? authReply(publicAccount(account, request.headers.get("X-Game-Server"))) : authReply({ error: "انتهت الجلسة" }, 401);
    }
    if (url.pathname === "/api/profile" && request.method === "GET") {
      const account = await this.userFromRequest(request);
      return account ? authReply({ account: publicAccount(account, request.headers.get("X-Game-Server")) }) : authReply({ error: "سجل الدخول أولاً" }, 401);
    }
    if (url.pathname === "/api/profile/save-position" && request.method === "POST") {
      const account = await this.userFromRequest(request);
      if (!account) return authReply({ error: "سجل الدخول أولاً" }, 401);
      const server = request.headers.get("X-Player-Server");
      const requestedServer = request.headers.get("X-Game-Server");
      const x = Number(request.headers.get("X-Player-X"));
      const z = Number(request.headers.get("X-Player-Z"));
      if (!SERVERS.has(server) || (requestedServer && requestedServer !== server) || !Number.isFinite(x) || !Number.isFinite(z)) return authReply({ error: "تعذر التحقق من موقع اللاعب" }, 400);
      const profile = account.serverProfiles[server];
      profile.spawnX = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, x));
      profile.spawnZ = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, z));
      await this.storage.put("user:" + account.username, account);
      return authReply({ account: publicAccount(account, server) });
    }

    if (url.pathname === "/api/missions" && request.method === "GET") {
      const account = await this.userFromRequest(request);
      if (!account) return authReply({ error: "سجل الدخول أولاً" }, 401);
      const server = request.headers.get("X-Game-Server") || "ME1";
      const profile = account.serverProfiles[server] || account.serverProfiles.ME1;
      const missions = AUTH_MISSIONS.filter(item => item.job === profile.job);
      return authReply({ missions, activeMission: profile.activeMission || null });
    }
    if (url.pathname === "/api/missions/start" && request.method === "POST") {
      const account = await this.userFromRequest(request);
      if (!account) return authReply({ error: "سجل الدخول أولاً" }, 401);
      const body = await request.json().catch(() => null);
      const requestedServer = body?.server;
      const headerServer = request.headers.get("X-Game-Server");
      if (!SERVERS.has(requestedServer) || (headerServer && headerServer !== requestedServer)) return authReply({ error: "اختر سيرفراً صالحاً" }, 400);
      const serverProfile = account.serverProfiles[requestedServer];
      if (!serverProfile) return authReply({ error: "اختر سيرفراً صالحاً" }, 400);
      if (serverProfile.activeMission) return authReply({ error: "لديك مهمة نشطة بالفعل" }, 409);
      const mission = AUTH_MISSIONS.find(item => item.id === body?.missionId && item.job === serverProfile.job);
      if (!mission) return authReply({ error: "المهمة غير متاحة لوظيفتك" }, 400);
      const missionToken = crypto.randomUUID() + crypto.randomUUID();
      serverProfile.activeMission = {
        id: mission.id,
        token: missionToken,
        server: requestedServer,
        startedAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000
      };
      await this.storage.put("user:" + account.username, account);
      return authReply({ mission, missionToken, startedAt: serverProfile.activeMission.startedAt });
    }
    if (url.pathname === "/api/missions/cancel" && request.method === "POST") {
      const account = await this.userFromRequest(request);
      if (!account) return authReply({ error: "سجل الدخول أولاً" }, 401);
      const server = request.headers.get("X-Game-Server") || "ME1";
      const profile = account.serverProfiles[server] || account.serverProfiles.ME1;
      profile.activeMission = null;
      await this.storage.put("user:" + account.username, account);
      return authReply({ ok: true });
    }
    if (url.pathname === "/api/missions/complete" && request.method === "POST") {
      const account = await this.userFromRequest(request);
      if (!account) return authReply({ error: "سجل الدخول أولاً" }, 401);
      const profileServer = request.headers.get("X-Game-Server") || "ME1";
      const profile = account.serverProfiles[profileServer] || account.serverProfiles.ME1;
      const active = profile.activeMission;
      const body = await request.json().catch(() => null);
      if (!active || !body?.missionToken || body.missionToken !== active.token) return authReply({ error: "لا توجد مهمة صالحة للإكمال" }, 409);
      if (active.expiresAt < Date.now()) {
        profile.activeMission = null;
        await this.storage.put("user:" + account.username, account);
        return authReply({ error: "انتهت مهلة المهمة" }, 410);
      }
      const mission = AUTH_MISSIONS.find(item => item.id === active.id && item.job === profile.job);
      if (!mission) return authReply({ error: "المهمة لم تعد متاحة" }, 409);
      if (Date.now() - active.startedAt < mission.minSeconds * 1000) return authReply({ error: "أكمل وقت المهمة أولاً" }, 425);
      const playerServer = request.headers.get("X-Player-Server") || profileServer;
      const x = Number(request.headers.get("X-Player-X")), z = Number(request.headers.get("X-Player-Z"));
      if (profileServer !== active.server || playerServer !== active.server || !Number.isFinite(x) || !Number.isFinite(z)) return authReply({ error: "عد إلى السيرفر الذي بدأت فيه المهمة" }, 409);
      if (Math.hypot(x - mission.destination.x, z - mission.destination.z) > 12) return authReply({ error: "اقترب من نقطة تسليم المهمة" }, 409);
      profile.cash = Math.max(0, Number(profile.cash) || 0) + mission.reward;
      profile.xp = Math.max(0, Number(profile.xp) || 0) + mission.xp;
      while (profile.xp >= profile.level * 500) {
        profile.xp -= profile.level * 500;
        profile.level += 1;
      }
      profile.activeMission = null;
      await this.storage.put("user:" + account.username, account);
      return authReply({ account: publicAccount(account, profileServer), reward: mission.reward, xp: mission.xp });
    }
    if (url.pathname === "/api/profile/job" && request.method === "POST") {
      const account = await this.userFromRequest(request);
      if (!account) return authReply({ error: "سجل الدخول أولاً" }, 401);
      const body = await request.json().catch(() => null);
      const job = AUTH_JOBS.find(item => item.id === body?.job);
      if (!job) return authReply({ error: "الوظيفة غير متاحة" }, 400);
      const server = request.headers.get("X-Game-Server") || "ME1";
      const profile = account.serverProfiles[server] || account.serverProfiles.ME1;
      profile.job = job.id;
      profile.activeMission = null;
      await this.storage.put("user:" + account.username, account);
      return authReply({ account: publicAccount(account, server) });
    }
    return authReply({ error: "المسار غير موجود" }, 404);
  }
}
