/** biome-ignore-all lint/style/useNamingConvention: <explanation> */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import env from '@/env';

// biome-ignore lint/performance/noNamespaceImport: <explanation>
import * as schema from './schema';

const queryClient = postgres(env.DATABASE_URL, {
  // 默认最大连接数
  max: 10,
  // 空闲连接保留时间，10s
  idle_timeout: 10,
  // 连接超时时间，30s
  connect_timeout: 30,
  transform: {
    //处理JS undefined 转 SQL NULL
    undefined: null,
  },
});

const db = drizzle({
  client: queryClient,
  schema,
  // 自动在数据库使用 snake_case 命名风格
  casing: 'snake_case',
  logger: env.NODE_ENV !== 'production',
});

export default db;
