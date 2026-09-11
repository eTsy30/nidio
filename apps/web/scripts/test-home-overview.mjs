/* global console, URL */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const now = new Date("2026-09-12T12:00:00");
const events = [
  { id: "past", startAt: "2026-09-12T09:00:00", allDay: false },
  { id: "later", startAt: "2026-09-14T18:00:00", allDay: false },
  { id: "today", startAt: "2026-09-12T00:00:00", allDay: true },
  { id: "ongoing", startAt: "2026-09-12T10:00:00", endAt: "2026-09-12T15:00:00", allDay: false },
];
let calendarOptions;
let taskOptions;
const taskQuery = { data: [], isSuccess: true };
const calendarQuery = { data: { events } };
const tasksApi = { getToday: () => {} };
const exports = {};
const filename = fileURLToPath(
  new URL("../screens/home/model/use-home-overview.ts", import.meta.url),
);
const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInNewContext(code, {
  exports,
  Date,
  require(name) {
    if (name === "react")
      return {
        useState: () => [now, () => {}],
        useEffect: () => {},
        useMemo: (factory) => factory(),
      };
    if (name === "@apollo/client/react")
      return {
        useQuery: (_query, options) => {
          calendarOptions = options;
          return calendarQuery;
        },
      };
    if (name === "@tanstack/react-query")
      return {
        useQuery: (options) => {
          taskOptions = options;
          return taskQuery;
        },
      };
    if (name === "@/features/calendar/graphql") return { GET_EVENTS: "Events" };
    if (name === "@/features/calendar/types") return { EventScope: { COUPLE: "COUPLE" } };
    if (name === "@/features/together/api/query-keys")
      return { togetherKeys: { today: () => ["together", "today"] } };
    if (name === "@/features/together/api/tasks.api") return { tasksApi };
    return require(name);
  },
});
const result = exports.useHomeOverview();
assert.equal(result.tasks, taskQuery);
assert.equal(result.calendar, calendarQuery);
assert.equal(taskOptions.queryFn, tasksApi.getToday);
assert.deepEqual(taskOptions.queryKey, ["together", "today"]);
assert.equal(calendarOptions.variables.filter.scope, "COUPLE");
assert.equal(calendarOptions.fetchPolicy, "cache-and-network");
assert.equal(new Date(calendarOptions.variables.filter.startFrom).getHours(), 0);
assert.equal(new Date(calendarOptions.variables.filter.startTo).getDate(), 19);
assert.deepEqual(
  Array.from(result.upcoming, (event) => event.id),
  ["today", "ongoing", "later"],
);
assert.equal(events[0].id, "past");
console.log(
  "PASS: shared query cache, seven-day couple calendar, ongoing/all-day events and chronological order",
);
