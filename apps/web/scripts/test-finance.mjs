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

const { createAmounts } = load(resolve(root, "savings-plan"));
for (const mode of ["equal", "random", "denominations"]) {
  for (const target of [1, 299, 10000, 1500001, 2000000000]) {
    const count = Math.min(30, target);
    const denominations = [
      Math.max(1, Math.ceil(target / 100)),
      Math.max(1, Math.ceil(target / 30)),
    ];
    const amounts = createAmounts(target, mode, count, denominations, () => 0.37);
    assert.equal(
      amounts.reduce((sum, n) => sum + n, 0),
      target,
    );
    assert(amounts.length > 0 && amounts.length <= 120);
    assert(amounts.every((n) => Number.isSafeInteger(n) && n > 0));
  }
}
assert.throws(() => createAmounts(10000000, "denominations", 30, [100]));
assert.throws(() => createAmounts(100, "equal", 101));
assert.throws(() => createAmounts(100, "denominations", 30, [0]));
assert.notDeepEqual(
  Array.from(createAmounts(100000, "random", 10, [], () => 0.1)),
  Array.from(
    createAmounts(
      100000,
      "random",
      10,
      [],
      (() => {
        let n = 0;
        return () => (++n % 9) / 10;
      })(),
    ),
  ),
);
console.log(
  "PASS: equal, random and denomination plans preserve exact sums and positive bounded steps.",
);

const { automaticGrid, scheduleDate, scheduledContribution } = load(
  resolve(root, "savings-strategy"),
);
for (const amount of [1, 15, 100000, 2000000000]) {
  const ascending = Array.from(automaticGrid(amount));
  const shuffled = Array.from(automaticGrid(amount, 24, false, true));
  assert.equal(
    ascending.reduce((sum, n) => sum + n, 0),
    amount,
  );
  assert.deepEqual(
    shuffled.sort((a, b) => a - b),
    ascending,
  );
}
assert.equal(scheduleDate("2027-01-31", "MONTH", 1), "2027-02-28");
assert.equal(scheduleDate("2027-01-31", "MONTH", 2), "2027-03-31");
assert.equal(scheduleDate("2024-01-31", "MONTH", 1), "2024-02-29");
const scheduled = {
  targetMinor: 10000,
  currentMinor: 0,
  transactions: [],
  scheduleStartDate: "2026-10-22",
  scheduleEvery: "WEEK",
  targetDate: "2026-11-12",
};
assert.equal(scheduledContribution(scheduled, "2026-10-22").amountMinor, 2500);
assert.equal(
  scheduledContribution(
    {
      ...scheduled,
      currentMinor: 1000,
      transactions: [{ type: "DEPOSIT", amountMinor: 1000, createdAt: "2026-10-22T12:00:00Z" }],
    },
    "2026-10-22",
  ).amountMinor,
  1500,
);
assert.equal(
  scheduledContribution(
    {
      ...scheduled,
      currentMinor: 2500,
      transactions: [{ type: "DEPOSIT", amountMinor: 2500, createdAt: "2026-10-22T12:00:00Z" }],
    },
    "2026-10-22",
  ).amountMinor,
  0,
);
assert.equal(
  scheduledContribution({ ...scheduled, currentMinor: 2500 }, "2026-10-29").amountMinor,
  2500,
);
assert.equal(
  scheduledContribution({ ...scheduled, targetDate: null, scheduleAmountMinor: 2000 }, "2026-10-22")
    .amountMinor,
  2000,
);
assert.equal(
  scheduledContribution({ ...scheduled, currentMinor: 10000 }, "2026-10-22").amountMinor,
  0,
);
assert.equal(scheduledContribution(scheduled, "2026-12-01").amountMinor, 10000);
console.log(
  "PASS: automatic grid, month-end schedules, partial/complete periods, fixed and deadline contributions.",
);

const { barcodeBits, cardCodeError, normalizeCardNumber } = load(resolve(root, "card-code"));
assert.equal(barcodeBits("4006381333931", "EAN13"), ean13Bits("4006381333931"));
assert.equal(barcodeBits("96385074", "EAN8").length, 67);
assert.equal(barcodeBits("96385075", "EAN8"), null);
assert.equal(barcodeBits("ABC-001", "CODE128").slice(0, 11), "11010010000");
assert.equal(barcodeBits("ABC-001", "CODE128").slice(-13), "1100011101011");
assert.equal(barcodeBits("123", "EAN13"), null);
assert.equal(barcodeBits("123", "NONE"), null);
assert.equal(cardCodeError("hello", "QR"), null);
assert.ok(cardCodeError("Карта", "CODE128"));
assert.equal(normalizeCardNumber(" 9638 5074 ", "EAN8"), "96385074");
assert.equal(normalizeCardNumber(" a b ", "QR"), " a b ");
console.log(
  "PASS: EAN checksum/encoding, Code128 guards, unknown code fallback, exact QR payload.",
);

// Independently decode the exact generated bars with the scanner's decoder.
const scannerRequire = createRequire(nativeRequire.resolve("@zxing/browser"));
const { BitArray, MultiFormatOneDReader } = scannerRequire("@zxing/library");
for (const [value, format] of [
  ["4006381333931", "EAN13"],
  ["96385074", "EAN8"],
  ["00000000", "EAN8"],
  ["ABC-001", "CODE128"],
  [" A B ", "CODE128"],
]) {
  const bits = "0".repeat(12) + barcodeBits(value, format) + "0".repeat(12);
  const row = new BitArray(bits.length);
  [...bits].forEach((bit, i) => {
    if (bit === "1") row.set(i);
  });
  assert.equal(new MultiFormatOneDReader().decodeRow(0, row).getText(), value);
}
console.log(
  "PASS: scanner independently decodes generated EAN13, EAN8 and Code128 bars without changing payloads.",
);

const { inferCardCode } = load(resolve(root, "card-code"));
assert.equal(inferCardCode("4006 3813 33931").barcodeFormat, "EAN13");
assert.equal(inferCardCode("96385074").barcodeFormat, "EAN8");
assert.equal(inferCardCode("4006381333932").barcodeFormat, "CODE128");
assert.equal(inferCardCode("ABC-001").barcodeFormat, "CODE128");
assert.equal(inferCardCode("https://example.com/card/123").barcodeFormat, "QR");
assert.equal(inferCardCode("Карта 123").barcodeFormat, "QR");
assert.equal(inferCardCode("00000000").cardNumber, "00000000");
console.log("PASS: automatic manual code selection, leading zeros and QR content.");
