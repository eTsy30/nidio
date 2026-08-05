import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig, env } from 'prisma/config';

import 'dotenv/config';
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

config({ path: resolve(__dirname, '..', envFile) });

export default defineConfig({
  schema: './prisma/schema.prisma',

  migrations: {
    path: './prisma/migrations',
  },

  datasource: {
    url: env('DATABASE_URL'),
  },
});
