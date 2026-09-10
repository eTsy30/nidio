import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';
import { Client } from 'pg';

config({
  path:
    process.env.NODE_ENV === 'production'
      ? '.env.production'
      : '.env.development',
  quiet: true,
});

// Only use after a backup and reconciliation. Never mark an outdated schema as applied.
function prisma(args) {
  const result = spawnSync('pnpm', ['exec', 'prisma', ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  assert.equal(result.status, 0, `prisma ${args.join(' ')} failed`);
}
prisma([
  'migrate',
  'diff',
  '--from-config-datasource',
  '--to-schema',
  'prisma/schema.prisma',
  '--exit-code',
]);
const client = new Client({
  connectionString:
    process.env.PRISMA_DATABASE_URL ??
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL,
});
const applied = new Set();
try {
  await client.connect();
  const exists = await client.query(
    "SELECT to_regclass('public._prisma_migrations') AS name",
  );
  if (exists.rows[0].name) {
    const history = await client.query(
      'SELECT migration_name, finished_at, rolled_back_at FROM public._prisma_migrations',
    );
    for (const row of history.rows) {
      assert(
        row.finished_at || row.rolled_back_at,
        `Unresolved failed migration: ${row.migration_name}`,
      );
      if (row.finished_at && !row.rolled_back_at)
        applied.add(row.migration_name);
    }
  }
} finally {
  await client.end();
}
for (const name of readdirSync('prisma/migrations')
  .filter((name) => /^\d/.test(name))
  .sort()) {
  if (applied.has(name)) continue;
  prisma(['migrate', 'resolve', '--applied', name]);
}
prisma(['migrate', 'deploy']);
prisma(['migrate', 'status']);
