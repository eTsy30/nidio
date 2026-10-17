/* global URL */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, { exports, Date, Map, require: (name) => mocks[name] ?? require(name) });
  return exports;
}
const { format } = require("date-fns");
const { groupCalendarDays } = load("../widgets/calendar/model/calendar-days.ts", {
  "@/features/calendar/model/utils": { getDateKey: (date) => format(date, "yyyy-MM-dd") },
});
const events = [
  { id: "night", startAt: "2026-10-31T23:00:00", endAt: "2026-11-01T02:00:00", allDay: false },
  { id: "midnight", startAt: "2026-10-31T20:00:00", endAt: "2026-11-01T00:00:00", allDay: false },
  { id: "day", startAt: "2026-11-01T00:00:00", endAt: "2026-11-02T00:00:00", allDay: true },
];
const map = groupCalendarDays(
  [...events, events[0]],
  new Date("2026-11-01T00:00:00"),
  new Date("2026-11-30T23:59:59"),
);
assert.deepEqual(
  Array.from(map.get("2026-11-01"), (e) => e.id),
  ["day", "night"],
);
assert.equal(map.has("2026-11-02"), false);
assert.equal(map.has("2026-10-31"), false);

let state = [],
  cursor = 0;
const { useEventForm } = load("../features/calendar/model/use-event-form.ts", {
  react: {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [
        state[index],
        (value) => {
          state[index] = typeof value === "function" ? value(state[index]) : value;
        },
      ];
    },
  },
});
let saved;
const initial = {
  title: "  Встреча  ",
  description: "",
  type: "OTHER",
  allDay: false,
  startTime: "23:00",
  endTime: "01:00",
  repeat: "NONE",
  reminder: "",
};
const render = (
  submit = (value) => {
    saved = value;
  },
) => {
  cursor = 0;
  return useEventForm(new Date("2026-10-16T12:00:00"), initial, submit);
};
let form = render();
await form.handleSubmit({ preventDefault() {} });
assert.equal(saved, undefined);
assert.match(render().error, /позже/);
form = render();
form.setEndDate("2026-10-17");
await render().handleSubmit({ preventDefault() {} });
assert.equal(saved.title, "Встреча");
assert.equal(format(saved.endAt, "yyyy-MM-dd HH:mm"), "2026-10-17 01:00");
form = render();
form.setAllDay(true);
form.setEndDate("2026-10-16");
await render().handleSubmit({ preventDefault() {} });
assert.equal(format(saved.startAt, "HH:mm"), "00:00");
assert.equal(format(saved.endAt, "yyyy-MM-dd HH:mm"), "2026-10-17 00:00");
form = render();
form.setStartDate("2026-10-20");
assert.equal(render().endDate, "2026-10-20");
await render(() => {
  throw new Error("network");
}).handleSubmit({ preventDefault() {} });
assert.match(render().error, /Не удалось сохранить/);
assert.equal(render().saving, false);
