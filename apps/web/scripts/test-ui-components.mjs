/* global console */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
function load(path) {
  const file = ["", ".tsx", ".ts", "/index.ts"].map((ext) => path + ext).find(existsSync);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  cache.set(file, module.exports);
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: (name) =>
        name.startsWith("@/")
          ? load(resolve(root, name.slice(2)))
          : name.startsWith(".")
            ? load(resolve(dirname(file), name))
            : nativeRequire(name),
    },
    { filename: file },
  );
  return module.exports;
}
const { Button } = load(resolve(root, "shared/ui/button/Button"));
const { ChoiceButton } = load(resolve(root, "shared/ui/button/ChoiceButton"));
const { Input } = load(resolve(root, "shared/ui/input/Input"));
const { Select } = load(resolve(root, "shared/ui/select/Select"));
const { Textarea } = load(resolve(root, "shared/ui/input/Textarea"));
const { Card } = load(resolve(root, "shared/ui/card/Card"));
const render = (component, props, ...children) =>
  renderToStaticMarkup(React.createElement(component, props, ...children));

assert.match(render(Button, {}, "Action"), /type="button"/);
assert.match(render(Button, { type: "submit" }, "Save"), /type="submit"/);
const pending = render(Button, { loading: true }, "Save");
assert.match(pending, /disabled=""/);
assert.match(pending, /aria-busy="true"/);
assert.match(
  render(Button, { iconOnly: true, "aria-label": "Close" }, React.createElement("svg")),
  /<svg/,
);
const link = render(
  Button,
  { asChild: true },
  React.createElement("a", { href: "/calendar" }, "Calendar"),
);
assert.match(link, /^<a /);
assert.match(link, /href="\/calendar"/);
assert.doesNotMatch(link, /<button/);
assert.match(render(ChoiceButton, { selected: true }, "Mine"), /aria-pressed="true"/);
assert.match(render(ChoiceButton, { selected: false }, "Ours"), /aria-pressed="false"/);
const field = render(Input, { label: "Title", name: "title", required: true });
const id = field.match(/<input[^>]* id="([^"]+)"/)[1];
assert.ok(field.includes(`for="${id}"`));
assert.match(field, /name="title"/);
assert.match(field, /required=""/);
const select = render(
  Select,
  { label: "Repeat", name: "repeat", defaultValue: "daily" },
  React.createElement("option", { value: "none" }, "Never"),
  React.createElement("option", { value: "daily" }, "Daily"),
);
assert.match(select, /value="daily" selected=""/);
assert.match(select, /pointer-events-none/);
assert.match(
  render(Textarea, { name: "note", defaultValue: "Hello", disabled: true }),
  />Hello<\/textarea>/,
);
assert.match(
  render(Card, { asChild: true }, React.createElement("section", null, "Content")),
  /^<section/,
);
console.log(
  "PASS: shared controls preserve form semantics, labels, loading, icon content, links and selection.",
);

// Year view must not nest day controls inside a clickable month button.
const { CalendarYear } = load(resolve(root, "widgets/calendar/ui/CalendarYear"));
const year = render(CalendarYear, { year: new Date(2026, 0, 1), events: [] });
let openButtons = 0;
for (const tag of year.matchAll(/<button\b[^>]*>|<\/button>/g)) {
  openButtons += tag[0].startsWith("</") ? -1 : 1;
  assert.ok(openButtons >= 0 && openButtons <= 1, "calendar buttons must not be nested");
}
assert.equal(openButtons, 0);
console.log("PASS: year calendar uses independent month and day buttons.");

const { newRun, jump, advance } = load(resolve(root, "shared/ui/recovery/runner"));
let runner = jump(newRun());
runner = advance(runner, 1 / 60);
assert.ok(runner.y > 0, "jump lifts the runner");
assert.equal(jump(runner).velocity, runner.velocity, "no second jump in mid-air");
assert.equal(advance({ ...newRun(), x: 95 }, 0).crashed, true, "ground obstacle collides");
assert.equal(advance({ ...newRun(), x: 95, y: 60 }, 0).crashed, false, "jump clears obstacle");
assert.equal(advance({ ...newRun(), x: -23 }, 0).score, 1, "passing obstacle earns one point");
for (let i = 0; i < 50; i++) runner = advance(runner, 1 / 60);
assert.equal(runner.y, 0, "runner lands on the ground");
const stopped = { ...newRun(), crashed: true };
assert.equal(advance(stopped, 1), stopped, "game stops on collision");
assert.ok(advance(newRun(), 60).x > 530, "long frame does not teleport obstacles");
console.log("PASS: recovery runner jump, landing, collisions, score and frame-time guard.");
