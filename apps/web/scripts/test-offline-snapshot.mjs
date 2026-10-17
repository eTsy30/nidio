/* global console, URL */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import { QueryClient } from "@tanstack/react-query";

const require = createRequire(import.meta.url);
const values = new Map();
const localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
const exports = {};
const source = fs.readFileSync(new URL("../shared/offline/snapshot.ts", import.meta.url), "utf8");
vm.runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  {
    exports,
    require,
    window: { localStorage },
    Date,
  },
);
const { saveOfflineSnapshot, restoreOfflineSnapshot, clearOfflineSnapshot, setLogoutPending } =
  exports;
const clients = [];
const client = () => {
  const value = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(value);
  return value;
};
const a = client();
const user = { id: "alice", firstName: "Алиса" };
a.setQueryData(["auth", "user"], user);
a.setQueryData(["relationship", "couple"], { id: "pair-a" });
a.setQueryData(["together", "board"], { columns: [{ title: "Планы" }] });
a.setQueryData(["loyalty-cards", "pair-a"], [{ number: "123" }]);
a.setQueryData(["savings", "pair-a"], [{ title: "Отпуск" }]);
a.setQueryData(["relationship", "invite", "secret"], { token: "secret-invite-token" });
a.setQueryData(["unknown"], { accessToken: "secret-access-token" });
a.getMutationCache().build(
  a,
  { mutationKey: ["login"] },
  { status: "pending", variables: { password: "secret-password" } },
);
const calendar = {
  extract: () => ({ ROOT_QUERY: { __typename: "Query", events: [] } }),
  restore: (data) => {
    calendar.restored = data;
  },
};
assert.equal(saveOfflineSnapshot(a, calendar, "alice"), true);
// A stale query with a failed background request is still useful offline.
a.getQueryCache()
  .find({ queryKey: ["together", "board"] })
  .setState({ status: "error", error: new Error("Network down") });
assert.equal(saveOfflineSnapshot(a, calendar, "alice"), true);
const raw = values.get("nidio:offline:v1");
assert(!raw.includes("secret-"), "tokens and mutation credentials are never persisted");
const b = client();
assert.equal(restoreOfflineSnapshot(b, calendar).id, "alice");
assert.deepEqual(JSON.parse(JSON.stringify(b.getQueryData(["together", "board"]))), {
  columns: [{ title: "Планы" }],
});
assert.equal(b.getQueryData(["loyalty-cards", "pair-a"])[0].number, "123");
assert.equal(b.getQueryData(["savings", "pair-a"])[0].title, "Отпуск");
assert.equal(b.getQueryData(["unknown"]), undefined);
assert.equal(b.getQueryState(["together", "board"]).status, "success");
assert.equal(calendar.restored.ROOT_QUERY.__typename, "Query");
assert.equal(
  saveOfflineSnapshot(a, calendar, "bob"),
  false,
  "never save an account under another identity",
);
for (const invalid of [
  "broken JSON",
  JSON.stringify({ ...JSON.parse(raw), version: 2 }),
  JSON.stringify({ ...JSON.parse(raw), userId: "bob" }),
  JSON.stringify({ ...JSON.parse(raw), savedAt: Date.now() - 31 * 86400000 }),
]) {
  values.set("nidio:offline:v1", invalid);
  assert.equal(restoreOfflineSnapshot(client(), calendar), null);
}
values.set("nidio:offline:v1", raw);
setLogoutPending(true);
assert.equal(
  restoreOfflineSnapshot(client(), calendar),
  null,
  "offline logout must survive reload",
);
assert.equal(saveOfflineSnapshot(a, calendar, "alice"), false);
clearOfflineSnapshot();
setLogoutPending(false);
assert.equal(restoreOfflineSnapshot(client(), calendar), null);
let failureNotifications = 0;
const unsubscribeFailure = exports.subscribeSnapshotFailure(() => { failureNotifications += 1; });
localStorage.setItem = () => {
  throw new Error("QuotaExceededError");
};
assert.equal(
  saveOfflineSnapshot(a, calendar, "alice"),
  false,
  "storage errors must not crash the application",
);
assert.equal(exports.getSnapshotFailure(), "alice");
assert.equal(failureNotifications, 1);
saveOfflineSnapshot(a, calendar, "alice");
assert.equal(failureNotifications, 1, "unchanged storage failure does not repeatedly notify");
localStorage.setItem = (key, value) => values.set(key, value);
assert.equal(saveOfflineSnapshot(a, calendar, "alice"), true);
assert.equal(exports.getSnapshotFailure(), null, "successful save clears the warning");
assert.equal(failureNotifications, 2);
unsubscribeFailure();
for (const value of clients) value.clear();
console.log(
  "Offline snapshot PASS: reload, profile/tasks/cards/savings/calendar, allowlist, no credentials, identity, expiry, corruption, quota and offline logout.",
);
