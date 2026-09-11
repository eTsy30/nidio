/* global console */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function loadComponent(file, mocks) {
  const filename = path.resolve(scriptDirectory, '..', file);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null };
      throw new Error(`Unexpected import: ${name}`);
    },
  }, { filename });
  return exports;
}

const relationshipModule = '@/features/relationship/hook/use-relationship';
const routes = { home: '/', invite: '/invite' };
for (const [label, query, expectedHome, expectedInvite] of [
  ['loading', { isLoading: true, isSuccess: false }, [], []],
  ['request failed', { isLoading: false, isSuccess: false }, [], []],
  ['no couple', { data: null, isSuccess: true }, ['/invite'], []],
  ['connected', { data: { id: 'couple' }, isSuccess: true }, [], ['/']],
  ['failed refetch with stale null', { data: null, isSuccess: false }, [], []],
]) {
  const redirects = [];
  const mocks = {
    react: { useEffect: (effect) => effect() },
    'next/navigation': { useRouter: () => ({ replace: (url) => redirects.push(url) }) },
    [relationshipModule]: {
      useCurrentCouple: () => query,
      useCurrentInvite: () => ({}),
      useCreateInvite: () => ({}),
      useLeaveCouple: () => ({}),
    },
    '@/shared/router/paths': { routes },
    '@/screens/home': {},
    '@/features/relationship/ui': {},
    '@/shared/lib/cn': { cn: () => '' },
    sonner: {},
  };
  loadComponent('app/(protected)/page.tsx', mocks).default();
  assert.deepEqual(redirects.splice(0), expectedHome, `home: ${label}`);
  loadComponent('screens/invite-partner/ui/InvitePartnerView.tsx', mocks).InvitePartnerView();
  assert.deepEqual(redirects, expectedInvite, `invite: ${label}`);
}

const handlers = {};
const invalidated = [];
const queryKeys = { relationship: { couple: ['relationship', 'couple'], invite: ['relationship', 'invite'] } };
const socket = { on: (event, handler) => { handlers[event] = handler; }, off: () => {} };
const provider = loadComponent('shared/realtime/provider/RealtimeProvider.tsx', {
  react: {
    createContext: () => ({}),
    useCallback: (callback) => callback,
    useContext: () => ({}),
    useEffect: (effect) => effect(),
    useState: (initial) => [initial, () => {}],
  },
  '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: ({ queryKey }) => invalidated.push(queryKey) }) },
  '@/shared/api/provider/auth-provider': { useAuth: () => ({ user: null, isLoading: true }) },
  '@/shared/api/query/query-keys': { queryKeys },
  '@/shared/lib/token': { subscribeAuth: () => () => {} },
  '../lib/socket': { getSocket: () => socket },
});
provider.RealtimeProvider({ children: null });
handlers['relationship.connected']();
assert.deepEqual(invalidated, [queryKeys.relationship.couple, queryKeys.relationship.invite]);
console.log('PASS: relationship redirects (5 states) and WebSocket cache invalidation');

for (const event of ["relationship.updated", "connect"]) {
  invalidated.length = 0;
  handlers[event]({ coupleId: "couple" });
  assert.deepEqual(invalidated, [queryKeys.relationship.couple]);
}
console.log("PASS: shared date refresh on update and reconnect");

for (const response of ["", null, { id: "pair" }]) {
  const api = loadComponent('features/relationship/api/relationship.api.ts', {
    '@/shared/api/client/api': { http: { get: async () => response } },
  });
  const couple = await api.getCurrentCouple();
  assert.deepEqual(couple, response === "" ? null : response);
  const redirects = [];
  loadComponent('app/(protected)/page.tsx', {
    react: { useEffect: (effect) => effect() },
    'next/navigation': { useRouter: () => ({ replace: (url) => redirects.push(url) }) },
    [relationshipModule]: { useCurrentCouple: () => ({ data: couple, isSuccess: true }) },
    '@/shared/router/paths': { routes },
    '@/screens/home': {},
  }).default();
  assert.deepEqual(redirects, couple === null ? ['/invite'] : []);
}
console.log('PASS: empty HTTP response redirects an unpaired user to invite');
