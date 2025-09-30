import { integer, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';
import { app } from '../app-schema';

// item表的字段描述
export const items = app.table('item', {
  // 使用uuid 需要启用gen_random_uuid(),
  // CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar({ length: 64 }).notNull(),
  payload: text(),
  sort: integer('sort').unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 用于查询数据，description 转化为openapi的描述信息
export const selectItemSchema = createSelectSchema(items, {
  id: (schema) => schema.meta({ description: '物料唯一编码' }),
  name: (schema) => schema.meta({ description: '物料名称' }),
  payload: (schema) =>
    schema.meta({ description: '物料不知道为啥有的一个字段' }),
  sort: (schema) => schema.meta({ description: '物料排序字段' }),
});
export const insertItemSchema = createInsertSchema(items, {
  // 覆盖 name的字段校验逻辑
  name: (filed) => filed.min(1).max(64),
  sort: (filed) => filed.int().nonnegative(),
})
  //从生成的 insert Zod schema 里删掉一些字段，id，createdAt应该由数据库自己生成
  .omit({ id: true, createdAt: true });

export const updateItemSchema = createUpdateSchema(items)
  // pick只选中可更新字段
  .pick({
    name: true,
    payload: true,
    sort: true,
  });

export const deleteItemSchema = z.object({
  id: z.uuid(),
});
