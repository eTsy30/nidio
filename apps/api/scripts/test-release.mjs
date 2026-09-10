import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

const url = process.env.RELEASE_TEST_DATABASE_URL;
assert(
  url,
  'Set RELEASE_TEST_DATABASE_URL to an isolated PostgreSQL /release_test database',
);
const base = new URL(url);
assert.equal(
  base.pathname,
  '/release_test',
  'Only a release_test database is allowed',
);
const admin = new Client({ connectionString: url });
const suites = [
  ['chat_access_test', 'CHAT_ACCESS_TEST_DATABASE_URL', 'chat-access'],
  ['auth_refresh_test', 'AUTH_REFRESH_TEST_DATABASE_URL', 'auth-refresh'],
  ['todo_push_test', 'TODO_TEST_DATABASE_URL', 'todo'],
  ['calendar_push_test', 'CALENDAR_PUSH_TEST_DATABASE_URL', 'calendar-push'],
];
function run(args, env) {
  const result = spawnSync('pnpm', args, { stdio: 'inherit', env });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `Failed: pnpm ${args.join(' ')}`);
}
try {
  await admin.connect();
  for (const [name, variable, file] of suites) {
    const exists = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [name],
    );
    if (!exists.rowCount) await admin.query(`CREATE DATABASE "${name}"`);
    const testUrl = new URL(base);
    testUrl.pathname = `/${name}`;
    const env = {
      ...process.env,
      DATABASE_URL: testUrl.href,
      DIRECT_URL: testUrl.href,
      PRISMA_DATABASE_URL: testUrl.href,
      [variable]: testUrl.href,
    };
    run(['exec', 'prisma', 'migrate', 'deploy'], env);
    run(['exec', 'prisma', 'migrate', 'deploy'], env);
    run(['exec', 'tsx', `test/${file}.integration.ts`], env);
  }
  console.info(
    'Release PostgreSQL checks passed: four suites, migration deploy and repeat deploy.',
  );
} finally {
  await admin.end();
}
