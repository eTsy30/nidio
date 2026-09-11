/* global console, URL, AbortController, queueMicrotask */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('../shared/api/storage/use-avatar-source.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
let effect;
let loaded;
let resolve;
let request;
const revoked = [];
const exports = {};
vm.runInNewContext(code, {
  exports, AbortController,
  URL: class extends URL {
    static createObjectURL() { return 'blob:avatar'; }
    static revokeObjectURL(url) { revoked.push(url); }
  },
  require(name) {
    if (name === 'react') return {
      useEffect: (callback) => { effect = callback; },
      useState: () => [null, (value) => { loaded = value; }],
    };
    if (name === '../config/api.config') return { apiConfig: { baseURL: 'http://localhost:4000' } };
    if (name === '../client/api') return { api: { get: (url, options) => {
      request = { url, options };
      return new Promise((done) => { resolve = done; });
    } } };
    throw new Error(name);
  },
});
const source = 'http://localhost:4000/storage/images/users%2Fuser%2Favatar.png';
assert.equal(exports.isProtectedImage(source), true);
for (const src of ['https://other.example/storage/images/a.png', 'blob:preview', 'data:image/png;base64,AA', undefined]) {
  assert.equal(exports.isProtectedImage(src), false);
  assert.equal(exports.useAvatarSource(src), src);
  effect();
  assert.equal(request, undefined);
}
assert.equal(exports.useAvatarSource(source), undefined);
const cleanup = effect();
assert.equal(request.url, source);
assert.equal(request.options.responseType, 'blob');
resolve({ data: {} });
await new Promise((done) => queueMicrotask(done));
assert.equal(loaded.url, 'blob:avatar');
assert.equal(loaded.source, source);
cleanup();
assert.equal(request.options.signal.aborted, true);
assert.deepEqual(revoked, ['blob:avatar']);
loaded = undefined;
exports.useAvatarSource(source);
const cancel = effect();
cancel();
resolve({ data: {} });
await new Promise((done) => queueMicrotask(done));
assert.equal(loaded, undefined);
console.log('PASS: authenticated image loading, external URL isolation, cleanup and cancellation');
