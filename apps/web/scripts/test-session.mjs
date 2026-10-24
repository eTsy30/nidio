/* global console, AbortSignal */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { URL } from "node:url";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync(new URL("../shared/api/session/session-coordinator.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
function session(fetch) {
  let token = null;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    fetch,
    AbortSignal,
    require: () => ({
      getAccessToken: () => token,
      setAccessToken: (value) => {
        token = value;
      },
      removeAccessToken: () => {
        token = null;
      },
    }),
  });
  return module.exports;
}
let calls = 0;
const restored = session(async (url, options) => {
  calls++;
  assert.equal(url, "/auth/refresh");
  assert.equal(options.credentials, "include");
  assert.equal(options.cache, "no-store");
  return { ok: true, status: 200, json: async () => ({ accessToken: "restored" }) };
});
assert.deepEqual(
  await Promise.all([restored.refreshAccessToken(), restored.refreshAccessToken()]),
  ["restored", "restored"],
);
assert.equal(calls, 1);
for (const response of [
  { ok: false, status: 503 },
  { ok: true, status: 200, json: async () => ({}) },
  {
    ok: true,
    status: 200,
    json: async () => {
      throw new Error("bad JSON");
    },
  },
]) {
  const client = session(async () => response);
  let expired = false;
  client.subscribeSessionExpired(() => {
    expired = true;
  });
  await assert.rejects(client.refreshAccessToken(), (error) => error.reason === "unavailable");
  assert.equal(expired, false);
}
const expired = session(async () => ({ ok: false, status: 401 }));
let notified = false;
expired.subscribeSessionExpired(() => {
  notified = true;
});
await assert.rejects(expired.refreshAccessToken(), (error) => error.reason === "expired");
assert.equal(notified, true);
console.log(
  "PASS: first-party session restore, deduplication, unavailable server and expired session.",
);
