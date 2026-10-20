/* global console */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../features/finance/model");
const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
function load(path) {
  const file = [path, path + ".ts"].find(existsSync);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  cache.set(file, module.exports);
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) =>
      name.startsWith(".") ? load(resolve(dirname(file), name)) : nativeRequire(name),
  });
  return module.exports;
}
const { parseMoney, progress, totals } = load(resolve(root, "money"));
const { ean13Bits } = load(resolve(root, "barcode"));
const { periodRange, previousMonth } = load(resolve(root, "period"));
const { entriesCsv } = load(resolve(root, "csv"));
assert.equal(parseMoney("0,10") + parseMoney("0.20"), 30);
assert.equal(parseMoney("1234,56"), 123456);
for (const value of ["0", "-1", "1.234", "NaN", "Infinity", "1e6", "20 000", "20000000.01"])
  assert.throws(() => parseMoney(value));
assert.equal(progress(0, 0), 0);
assert.equal(progress(150, 100), 100);
assert.equal(progress(-10, 100), 0);
const entry = {
  id: "a",
  type: "INCOME",
  amountMinor: 10000,
  currency: "EUR",
  category: "salary",
  description: '=HYPERLINK("bad")',
  date: "2026-10-01",
  createdBy: "a",
  requestId: "a",
};
const result = totals([entry, { ...entry, type: "EXPENSE", amountMinor: 1250 }]);
assert.equal(result.balance, 8750);
assert.equal(result.income, 10000);
assert.equal(result.expense, 1250);
assert.equal(totals([]).balance, 0);
assert.equal(periodRange("week", new Date(2026, 9, 18)).start, "2026-10-12");
assert.equal(periodRange("week", new Date(2026, 9, 18)).end, "2026-10-18");
assert.equal(previousMonth(new Date(2026, 0, 3)).start, "2025-12-01");
assert.equal(periodRange("month", new Date(2024, 1, 15)).end, "2024-02-29");
assert.equal(
  ean13Bits("0000000000000"),
  "101" + "0001101".repeat(6) + "01010" + "1110010".repeat(6) + "101",
);
assert.equal(ean13Bits("4006381333931").length, 95);
assert.equal(ean13Bits("4006381333932"), null);
assert.equal(ean13Bits("unknown"), null);
const csv = entriesCsv([entry], () => "+formula");
assert.ok(csv.startsWith("\uFEFF"));
assert.ok(csv.includes("'=HYPERLINK"));
assert.ok(csv.includes("'+formula"));
assert.ok(csv.includes('""bad""'));
console.log(
  "PASS: integer money, zero-safe/clamped progress, cumulative balance, period boundaries, EAN-13 vectors and safe CSV export.",
);
