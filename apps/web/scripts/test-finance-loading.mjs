/* global console */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { EventEmitter } from "node:events";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(relative, overrides) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require: (name) => (name in overrides ? overrides[name] : require(name)),
  });
  return exports;
}
const { isFinanceAccessError } = load("../features/finance/api/finance-query.ts", {
  "@/shared/api/client/api": {},
  "@/shared/api/provider/auth-provider": {},
  "./FinanceProvider": {},
});
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const key = ["test-finance"];
client.setQueryData(key, { coupleId: "pair", cards: [{ id: "card" }] });
let query = {};
const ui = ({ children }) => React.createElement("div", null, children);
const { FinancePage } = load("../screens/finance/ui/FinancePage.tsx", {
  react: { ...React, lazy: () => () => React.createElement("div", null, "existing-card") },
  "@/features/finance/api/finance-query": { isFinanceAccessError },
  "@/features/finance/api/FinanceProvider": { FinanceProvider: ui, useFinanceData: () => query },
  "@/features/relationship/hook/use-relationship": {
    useCurrentCouple: () => ({ data: { id: "pair" } }),
  },
  "@/shared/ui": { Button: ui, Card: ui, Link: ui },
  "@/shared/ui/loading/LoadingState": {
    LoadingState: () => React.createElement("div", { role: "status" }, "loading"),
  },
});
function render() {
  const state = client.getQueryState(key);
  query = {
    data: state.data,
    error: state.error,
    isError: state.status === "error",
    isPending: state.status === "pending",
  };
  return renderToStaticMarkup(React.createElement(FinancePage, { section: "cards" }));
}
assert.match(render(), /existing-card/);
await client
  .fetchQuery({
    queryKey: key,
    staleTime: 0,
    queryFn: async () => {
      throw new Error("offline");
    },
  })
  .catch(() => {});
assert.match(render(), /existing-card/);
assert.match(render(), /сохранённая версия/);
const denied = new AxiosError("Forbidden", "403", undefined, undefined, { status: 403 });
await client
  .fetchQuery({
    queryKey: key,
    staleTime: 0,
    queryFn: async () => {
      throw denied;
    },
  })
  .catch(() => {});
assert.doesNotMatch(render(), /existing-card/);
client.clear();

// Exercise the socket callbacks registered by the real finance query hook.
const socket = new EventEmitter();
socket.connected = false;
let invalidations = 0;
let pending = 0;
const cleanups = [];
const hooks = load("../features/finance/api/FinanceProvider.tsx", {
  react: {
    ...React,
    useEffect: (effect) => cleanups.push(effect()),
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
  },
  "@tanstack/react-query": {
    useQuery: (options) => options,
    useQueryClient: () => ({
      isMutating: () => pending,
      invalidateQueries: () => {
        invalidations++;
        return Promise.resolve();
      },
    }),
  },
  "@/shared/api/client/api": { http: {} },
  "@/shared/api/provider/auth-provider": { useAuth: () => ({ user: { id: "alice" } }) },
  "@/shared/realtime/provider/RealtimeProvider": { useRealtimeContext: () => ({ socket }) },
});
assert.equal(hooks.useFinanceData("pair", "cards").refetchInterval, 30000);
socket.emit("finance.updated");
assert.equal(invalidations, 1);
pending = 1;
socket.emit("finance.updated");
assert.equal(
  invalidations,
  1,
  "own writes reconcile in onSettled instead of duplicate socket refetch",
);
pending = 0;
socket.connected = true;
socket.emit("connect");
assert.equal(invalidations, 2, "reconnection reconciles missed events");
cleanups.splice(0).forEach((cleanup) => cleanup());
assert.equal(hooks.useFinanceData("pair", "cards").refetchInterval, false);
cleanups.splice(0).forEach((cleanup) => cleanup());
assert.equal(socket.listenerCount("finance.updated"), 0);
console.log(
  "PASS: cached cards survive network errors, denied access hides cards, socket refresh/reconnect and fallback polling.",
);
