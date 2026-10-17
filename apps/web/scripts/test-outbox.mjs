/* global console, URL */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const values = new Map();
let writable = true;
const localStorage = {
  get length() {
    return values.size;
  },
  key: (index) => [...values.keys()][index] ?? null,
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => {
    if (!writable) throw new Error("QuotaExceededError");
    values.set(key, value);
  },
  removeItem: (key) => values.delete(key),
};
const window = { localStorage, addEventListener() {}, removeEventListener() {} };
function load(name, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(new URL(`../shared/offline/${name}.ts`, import.meta.url), "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      assert(name in dependencies, `Unexpected dependency ${name}`);
      return dependencies[name];
    },
    window,
    Date,
    encodeURIComponent,
  });
  return exports;
}
const queue = load("outbox");
const input = { userId: "alice", coupleId: "pair-a", goalId: "goal-a", installmentId: "cell-a" };
queue.queueSavingsSave(input);
queue.queueSavingsSave(input);
assert.equal(
  queue.listOutbox("alice").length,
  1,
  "repeat clicks coalesce by the entity being changed",
);
const reloaded = load("outbox");
assert.equal(
  reloaded.listOutbox("alice").length,
  1,
  "a fresh JS session restores durable operations",
);
assert.equal(reloaded.listOutbox("bob").length, 0);
queue.queueSavingsSave({ ...input, userId: "bob", installmentId: "cell-b" });
values.set("nidio:outbox:v1:broken", "bad JSON");
assert.equal(queue.listOutbox("alice").length, 1, "corrupt entries do not hide healthy entries");
writable = false;
assert.throws(() => queue.queueSavingsSave({ ...input, installmentId: "no-space" }), /место/);
assert.equal(
  queue.listOutbox("alice").length,
  1,
  "failed persistence never reports a saved operation",
);
writable = true;
const { syncOutbox } = load("outbox-sync", { "./outbox": queue });
let current = true;
const effects = new Set();
let calls = 0;
let failAfterCommit = true;
let persisted = false;
const transport = {
  userId: "alice",
  isCurrent: () => current,
  getCoupleId: async () => "pair-a",
  send: async (operation) => {
    calls++;
    effects.add(operation.installmentId);
    if (failAfterCommit) throw new Error("Lost response after the server committed");
  },
  onConfirmed: async () => {
    persisted = true;
  },
};
await syncOutbox(transport);
assert.equal(
  queue.listOutbox("alice").length,
  1,
  "an ambiguous network failure keeps the operation",
);
assert.equal(persisted, false);
failAfterCommit = false;
await syncOutbox(transport);
assert.equal(effects.size, 1, "replay changes the server state only once");
assert.equal(calls, 2);
assert.equal(persisted, true);
assert.equal(queue.listOutbox("alice").length, 0);
assert.equal(queue.listOutbox("bob").length, 1, "one account cannot drain another account's queue");
queue.queueSavingsSave(input);
await syncOutbox({ ...transport, getCoupleId: async () => "new-pair" });
assert.equal(calls, 2, "never send an operation belonging to an old pair");
assert.equal(queue.listOutbox("alice")[0].status, "failed");
queue.queueSavingsSave(input);
await syncOutbox({
  ...transport,
  send: async () => {
    throw { response: { status: 404 } };
  },
});
assert.equal(queue.listOutbox("alice")[0].status, "failed");
assert.match(queue.listOutbox("alice")[0].error, /недоступны/);
for (const status of [401, 408, 429, 500, 503]) {
  queue.queueSavingsSave(input);
  await syncOutbox({
    ...transport,
    send: async () => {
      throw { response: { status } };
    },
  });
  assert.equal(queue.listOutbox("alice")[0].status, "pending", `${status} must remain retryable`);
}
await assert.rejects(
  syncOutbox({
    ...transport,
    onConfirmed: async () => {
      throw new Error("disk full");
    },
  }),
  /disk full/,
);
assert.equal(
  queue.listOutbox("alice").length,
  1,
  "a crash before local acknowledgement can replay safely",
);
await syncOutbox({
  ...transport,
  send: async () => {
    current = false;
  },
});
assert.equal(
  queue.listOutbox("alice").length,
  1,
  "logout during a request cannot acknowledge a previous account",
);
current = true;
let release;
let sends = 0;
let signalStarted;
const started = new Promise((resolve) => {
  signalStarted = resolve;
});
const slow = {
  ...transport,
  send: async () => {
    sends++;
    signalStarted();
    await new Promise((resolve) => {
      release = resolve;
    });
  },
};
const first = syncOutbox(slow);
const second = syncOutbox(slow);
assert.equal(first, second, "concurrent flushes in one tab share a single operation");
await started;
release();
await first;
assert.equal(sends, 1);
queue.queueSavingsSave(input);
queue.clearOutbox("alice");
assert.equal(queue.listOutbox("alice").length, 0);
assert.equal(queue.listOutbox("bob").length, 1);
console.log(
  "Outbox PASS: persistence/reload, duplicates, account/pair isolation, corruption/quota, lost response replay, HTTP failures, interrupted acknowledgement, logout and concurrent flush.",
);
