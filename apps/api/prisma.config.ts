import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

config({
  path: resolve(process.cwd(), envFile),
  override: false,
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url:
      process.env.PRISMA_DATABASE_URL ??
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      '',
  },
});
