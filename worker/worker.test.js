import test from "node:test";
import assert from "node:assert/strict";
import { AccountStore } from "./index.js";

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
  account.activeMission.startedAt = Date.now() - 60000;
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
