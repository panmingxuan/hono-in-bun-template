import { defineConfig } from 'drizzle-kit';
import env from '@/env';

export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
