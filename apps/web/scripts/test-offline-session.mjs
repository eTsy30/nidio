/* global console, URL, setTimeout, clearTimeout */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(
  fs.readFileSync(new URL("../app/providers/AuthProvider.tsx", import.meta.url), "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  },
).outputText;

async function scenario({ online, savedUser = null, refreshFailure, pendingLogout = false }) {
  let token = null;
  let profile = null;
  let snapshot = savedUser;
  let clears = 0;
  let refreshes = 0;
  let ended;
  const authListeners = [];
  const browserListeners = new Map();
  const slots = [];
  let cursor = 0;
  let effects = [];
  let dirty = false;
  const depsChanged = (a, b) => !a || a.length !== b.length || a.some((v, i) => v !== b[i]);
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: initial };
      return [
        slots[i].value,
        (value) => {
          const next = typeof value === "function" ? value(slots[i].value) : value;
          if (next !== slots[i].value) {
            slots[i].value = next;
            dirty = true;
          }
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return (slots[i] ??= { current: initial });
    },
    useCallback(fn, deps) {
      const i = cursor++;
      if (!slots[i] || depsChanged(slots[i].deps, deps)) slots[i] = { fn, deps };
      return slots[i].fn;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || depsChanged(slots[i].deps, deps)) {
        const previous = slots[i];
        slots[i] = { deps };
        effects.push(() => {
          previous?.cleanup?.();
          slots[i].cleanup = fn();
        });
      }
    },
  };
  const client = {
    removeQueries: () => {
      profile = null;
    },
    clear: () => {
      clears++;
      profile = null;
    },
    setQueryData: (_key, value) => {
      profile = value;
    },
    getQueryData: () => profile,
    invalidateQueries: async () => {},
    fetchQuery: async () => {
      profile = { id: "alice" };
      return profile;
    },
  };
  const mocks = {
    react,
    "react/jsx-runtime": { jsx: (_type, props) => props },
    "@tanstack/react-query": {
      useQueryClient: () => client,
      useQuery: () => ({ data: profile }),
      onlineManager: { setOnline: () => {} },
    },
    "@/features/auth/api/auth.api": {
      me: () => {},
      logout: async () => {
        pendingLogout = false;
        token = null;
      },
    },
    "@/features/push/push-client": { disablePush: async () => {} },
    "@/shared/api/client/api": { http: { post: async () => {} } },
    "@/shared/api/provider/auth-context": { AuthContext: { Provider: "Provider" } },
    "@/shared/api/query/query-keys": { queryKeys: { auth: { user: ["auth", "user"] } } },
    "@/shared/api/session/session-coordinator": {
      isSessionRefreshError: (error, reason) => error?.reason === reason,
      subscribeSessionExpired: (listener) => {
        ended = listener;
        return () => {};
      },
      refreshAccessToken: async () => {
        refreshes++;
        if (refreshFailure) throw { reason: refreshFailure };
        token = "memory-only-token";
        authListeners.forEach((fn) => fn());
        return token;
      },
    },
    "@/shared/lib/apollo-client": {
      apolloClient: { cache: {}, clearStore: async () => {}, refetchQueries: async () => {} },
    },
    "@/shared/lib/token": {
      getAccessToken: () => token,
      subscribeAuth: (listener) => {
        authListeners.push(listener);
        return () => {};
      },
    },
    "@/shared/offline/snapshot": {
      clearOfflineSnapshot: () => {
        snapshot = null;
      },
      isLogoutPending: () => pendingLogout,
      savedOfflineUserId: () => snapshot?.id ?? null,
      restoreOfflineSnapshot: () => {
        profile = snapshot;
        return snapshot;
      },
    },
    "@/shared/offline/outbox": { clearOutbox: () => {}, listOutbox: () => [] },
    "@/shared/offline/use-offline-persistence": { useOfflinePersistence: () => {} },
    "@/shared/router/paths": { routes: { login: "/login" } },
  };
  const navigator = { onLine: online };
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      assert(name in mocks, `Unexpected import ${name}`);
      return mocks[name];
    },
    navigator,
    Intl,
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: () => {},
    window: {
      location: { pathname: "/", search: "", replace: () => {} },
      addEventListener: (event, fn) => browserListeners.set(event, fn),
      removeEventListener: (event, fn) => {
        if (browserListeners.get(event) === fn) browserListeners.delete(event);
      },
    },
  });
  let context;
  async function settle() {
    for (let i = 0; i < 12; i++) {
      cursor = 0;
      dirty = false;
      context = exports.AuthProvider({ children: null }).value;
      const queued = effects;
      effects = [];
      queued.forEach((fn) => fn());
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (!dirty && !effects.length && i > 1) break;
    }
    return context;
  }
  await settle();
  return {
    context,
    refreshes,
    expire: async () => {
      ended();
      return settle();
    },
    reconnect: async () => {
      navigator.onLine = true;
      refreshFailure = undefined;
      browserListeners.get("online")?.();
      return settle();
    },
    cleared: () => clears,
    snapshot: () => snapshot,
  };
}
let run = await scenario({ online: false, savedUser: { id: "alice" } });
assert.equal(run.context.isAuthenticated, true);
assert.equal(run.context.isOfflineSession, true);
assert.equal(run.context.user.id, "alice");
assert.equal(run.refreshes, 0);
const connected = await run.reconnect();
assert.equal(connected.isOfflineSession, false);
assert.equal(connected.isAuthenticated, true);
const expired = await run.expire();
assert.equal(expired.isAuthenticated, false);
assert.equal(run.snapshot(), null);
run = await scenario({ online: false });
assert.equal(run.context.isAuthenticated, false);
run = await scenario({ online: false, savedUser: { id: "alice" }, pendingLogout: true });
assert.equal(run.context.isAuthenticated, false);
assert.equal(run.snapshot(), null);
run = await scenario({ online: true, savedUser: { id: "alice" }, refreshFailure: "unavailable" });
assert.equal(run.context.isOfflineSession, true);
run = await scenario({ online: true, savedUser: { id: "alice" }, refreshFailure: "expired" });
assert.equal(run.context.isAuthenticated, false);
assert.equal(run.snapshot(), null);
console.log(
  "Offline session PASS: reload without network, missing snapshot, server outage, reconnect, expired session and pending logout.",
);
