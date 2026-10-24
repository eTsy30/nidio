/* global console, URL */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const exports = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      new URL("../features/together/model/optimistic-task-cache.ts", import.meta.url),
      "utf8",
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { exports },
);
const { optimisticTask, replaceCachedTask } = exports;
const a = { id: "a", completed: false, completions: [], assigneeMode: "ME" };
const b = { ...a, id: "b" };
const completedA = optimisticTask(a, "complete", "me");
assert.equal(completedA.completed, true);
const together = { ...a, assigneeMode: "BOTH" };
const half = optimisticTask(together, "complete", "me");
assert.equal(half.completed, false);
assert.equal(optimisticTask(half, "complete", "me").completions.length, 1);
assert.equal(optimisticTask(half, "complete", "partner").completed, true);
assert.equal(optimisticTask(completedA, "activate", "me").completions.length, 0);
const board = { columns: [{ id: "col", tasks: [a, b] }] };
const deletedA = replaceCachedTask(board, "a", null);
const completedB = replaceCachedTask(deletedA, "b", optimisticTask(b, "complete", "me"));
const restored = replaceCachedTask(completedB, "a", a, board);
assert.equal(restored.columns[0].tasks[0].id, "a");
assert.equal(
  restored.columns[0].tasks[1].completed,
  true,
  "rollback must preserve another task's mutation",
);
assert.equal(board.columns[0].tasks[1].completed, false, "cache updates are immutable");
const list = replaceCachedTask([a, b], "a", completedA);
assert.equal(list[0].completed, true);
assert.equal(replaceCachedTask(list, "a", a)[0].completed, false);
console.log(
  "PASS: completion, shared task, activation, deletion and isolated rollback in board/list caches.",
);
