import { pgSchema } from 'drizzle-orm/pg-core';

/**
 * 自定义schema
 * 应用独占一个schema，方便归拢表和数据
 * 需要在运行 db:generate 由 drizzle-kit generates 生成SQL文件后，手动补加schema_name
 *  CREATE SCHEMA IF NOT EXISTS schema_name;
 *  启用gen_random_uuid()
 *  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
 */
export const app = pgSchema('hono-app');
