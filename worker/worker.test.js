import test from "node:test";
import assert from "node:assert/strict";
import { AccountStore, GameRoom } from "./index.js";

function makeStore() {
  const data = new Map();
  const storage = {
    async get(key) { return structuredClone(data.get(key)); },
    async put(key, value) {
      if (key && typeof key === "object" && value === undefined) {
        for (const [entryKey, entryValue] of Object.entries(key)) data.set(entryKey, structuredClone(entryValue));
      } else data.set(key, structuredClone(value));
    },
    async delete(key) { return data.delete(key); }
  };
  return { store: new AccountStore({ storage }), data };
}
function request(path, method = "GET", body = null, token = "") {
  const headers = {};
  if (body !== null) headers["content-type"] = "application/json";
  if (token) headers.authorization = "Bearer " + token;
  return new Request("https://accounts.test" + path, {
    method, headers, body: body === null ? undefined : JSON.stringify(body)
  });
}

test("register, login and profile persist without exposing password hashes", async () => {
  const { store } = makeStore();
  const registered = await store.fetch(request("/api/auth/register", "POST", {
    username: "walid_test", displayName: "Walid", password: "SafePass_123"
  }));
  assert.equal(registered.status, 201);
  const result = await registered.json();
  assert.ok(result.token);
  assert.equal(result.account.cash, 2500);
  assert.equal("passwordHash" in result.account, false);

  const badLogin = await store.fetch(request("/api/auth/login", "POST", {
    username: "walid_test", password: "wrong-password"
  }));
  assert.equal(badLogin.status, 401);

  const login = await store.fetch(request("/api/auth/login", "POST", {
    username: "walid_test", password: "SafePass_123"
  }));
  assert.equal(login.status, 200);
  const signedIn = await login.json();
  const profile = await store.fetch(request("/api/profile", "GET", null, signedIn.token));
  assert.equal(profile.status, 200);
  assert.equal((await profile.json()).account.displayName, "Walid");
});

test("mission rewards require the right destination and a minimum duration", async () => {
  const { store, data } = makeStore();
  const register = await store.fetch(request("/api/auth/register", "POST", {
    username: "mission_test", displayName: "Mission", password: "SafePass_456"
  }));
  const { token } = await register.json();

  await store.fetch(request("/api/profile/job", "POST", { job: "police" }, token));
  const start = await store.fetch(request("/api/missions/start", "POST", {
    missionId: "police_patrol", server: "ME1"
  }, token));
  assert.equal(start.status, 200);
  const started = await start.json();

  const account = data.get("user:mission_test");
  account.serverProfiles.ME1.activeMission.startedAt = Date.now() - 60000;
  await data.set("user:mission_test", account);

  const tooFar = await store.fetch(new Request("https://accounts.test/api/missions/complete", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + token,
      "X-Player-Server": "ME1",
      "X-Player-X": "0",
      "X-Player-Z": "0"
    },
    body: JSON.stringify({ missionToken: started.missionToken })
  }));
  assert.equal(tooFar.status, 409);

  const completed = await store.fetch(new Request("https://accounts.test/api/missions/complete", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + token,
      "X-Player-Server": "ME1",
      "X-Player-X": "-175",
      "X-Player-Z": "35"
    },
    body: JSON.stringify({ missionToken: started.missionToken })
  }));
  assert.equal(completed.status, 200);
  const result = await completed.json();
  assert.equal(result.account.cash, 2850);
  assert.equal(result.account.xp, 70);
  assert.equal(result.account.job, "police");
});


test("saved spawn is clamped and returned in the persistent profile", async () => {
  const { store } = makeStore();
  const registered = await store.fetch(request("/api/auth/register", "POST", {
    username: "spawn_test", displayName: "Spawn", password: "SafePass_789"
  }));
  const { token } = await registered.json();

  const unverified = await store.fetch(request("/api/profile/save-position", "POST", { server: "ME2" }, token));
  assert.equal(unverified.status, 400);

  const verified = await store.fetch(new Request("https://accounts.test/api/profile/save-position", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + token,
      "X-Player-Server": "ME2",
      "X-Player-X": "999",
      "X-Player-Z": "-999"
    },
    body: JSON.stringify({ server: "ME2" })
  }));
  assert.equal(verified.status, 200);
  const saved = await verified.json();
  assert.equal(saved.account.spawnX, 350);
  assert.equal(saved.account.spawnZ, -350);
});


test("multiplayer interest management sends nearby players and removes distant ones", () => {
  class FakeSocket {
    constructor() { this.messages = []; }
    send(raw) { this.messages.push(JSON.parse(raw)); }
  }
  const room = new GameRoom({});
  const socketA = new FakeSocket();
  const socketB = new FakeSocket();
  const playerA = { id: "a", name: "A", x: 0, z: 0, yaw: 0, server: "ME1" };
  const playerB = { id: "b", name: "B", x: 300, z: 0, yaw: 0, server: "ME1" };
  room.sessions.set(socketA, playerA);
  room.sessions.set(socketB, playerB);
  room.visiblePlayers.set(socketA, new Set());
  room.visiblePlayers.set(socketB, new Set());

  room.broadcastMovement(playerA, socketA);
  assert.equal(socketA.messages.length, 0);
  assert.equal(socketB.messages.length, 0);

  playerB.x = 150;
  room.broadcastMovement(playerB, socketB);
  assert.ok(socketA.messages.some(message => message.type === "player_joined" && message.player.id === "b"));
  assert.ok(socketB.messages.some(message => message.type === "player_joined" && message.player.id === "a"));

  socketA.messages.length = 0;
  socketB.messages.length = 0;
  playerB.x = 300;
  room.broadcastMovement(playerB, socketB);
  assert.ok(socketA.messages.some(message => message.type === "player_left" && message.id === "b"));
  assert.ok(socketB.messages.some(message => message.type === "player_left" && message.id === "a"));
});


test("local chat is sanitized, proximity-scoped and rate-limited", () => {
  class FakeSocket {
    constructor() { this.messages = []; }
    send(raw) { this.messages.push(JSON.parse(raw)); }
  }
  const room = new GameRoom({});
  const socketA = new FakeSocket();
  const socketB = new FakeSocket();
  const playerA = { id: "a", name: "A", x: 0, z: 0, yaw: 0, lastMove: Date.now(), lastChat: 0, server: "ME1" };
  const playerB = { id: "b", name: "B", x: 30, z: 0, yaw: 0, lastMove: Date.now(), lastChat: 0, server: "ME1" };
  room.sessions.set(socketA, playerA);
  room.sessions.set(socketB, playerB);
  room.visiblePlayers.set(socketA, new Set(["b"]));
  room.visiblePlayers.set(socketB, new Set(["a"]));

  room.onMessage(socketA, JSON.stringify({ type: "chat", message: "  مرحباً\nبالمدينة  " }));
  assert.equal(socketA.messages.length, 1);
  assert.equal(socketB.messages.length, 1);
  assert.equal(socketB.messages[0].message, "مرحباً بالمدينة");
  room.onMessage(socketA, JSON.stringify({ type: "chat", message: "رسالة متكررة" }));
  assert.equal(socketA.messages.length, 1);
  assert.equal(socketB.messages.length, 1);
});


test("ME1, ME2 and ME3 keep separate cash, jobs, missions and saved locations", async () => {
  const { store, data } = makeStore();
  const registered = await store.fetch(new Request("https://accounts.test/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Game-Server": "ME1" },
    body: JSON.stringify({ username: "server_split", displayName: "Split", password: "SafePass_987" })
  }));
  const { token } = await registered.json();

  const changeMe2Job = await store.fetch(new Request("https://accounts.test/api/profile/job", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + token, "X-Game-Server": "ME2" },
    body: JSON.stringify({ job: "police" })
  }));
  assert.equal((await changeMe2Job.json()).account.job, "police");

  const me1 = await store.fetch(new Request("https://accounts.test/api/profile", {
    headers: { authorization: "Bearer " + token, "X-Game-Server": "ME1" }
  }));
  const me2 = await store.fetch(new Request("https://accounts.test/api/profile", {
    headers: { authorization: "Bearer " + token, "X-Game-Server": "ME2" }
  }));
  const me3 = await store.fetch(new Request("https://accounts.test/api/profile", {
    headers: { authorization: "Bearer " + token, "X-Game-Server": "ME3" }
  }));
  assert.equal((await me1.json()).account.job, "citizen");
  assert.equal((await me2.json()).account.job, "police");
  assert.equal((await me3.json()).account.job, "citizen");

  const stored = data.get("user:server_split");
  stored.serverProfiles.ME2.cash = 9999;
  await data.set("user:server_split", stored);
  const reloadedMe1 = await store.fetch(new Request("https://accounts.test/api/profile", {
    headers: { authorization: "Bearer " + token, "X-Game-Server": "ME1" }
  }));
  assert.equal((await reloadedMe1.json()).account.cash, 2500);
});
