/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */
import { serve } from 'bun';
import * as z from 'zod';
import app from './app';
import env from './env';
import logger from './libs/logger';

z.config(z.locales.zhCN());

serve({
  fetch: app.fetch,
  port: env.PORT,
});

logger.info(` 🚀 服务启动成功 → (http://localhost:${env.PORT}) `);
