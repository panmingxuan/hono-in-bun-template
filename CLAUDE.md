# AI 协作指南：唯一范式与落地实践（以 item 模块为准）

本文档要求 AI 在本项目中的一切 API 与数据库开发，严格以现有示例为唯一范式：

- 路由与处理器范式：参考 `./src/routes/item` 下的真实代码
  - 契约定义：`./src/routes/item/item.routes.ts`
  - 处理实现：`./src/routes/item/itme.handlers.ts`
  - 模块装配：`./src/routes/item/index.ts`
- 数据库与 Schema 范式：参考 `./src/db/schema/item` 下的真实代码
  - 表与 Zod：`./src/db/schema/item/item.ts`
  - Schema 汇总：`./src/db/schema/index.ts`
  - 应用 Schema 前缀：`./src/db/schema/app-schema.ts`

请不要从零杜撰风格或随意更改目录/命名。对齐上述文件的风格、导入路径、注释与错误处理模式。

## 路由契约：严格使用 @hono/zod-openapi（照抄 item.routes.ts 模式）

关键要点：

- 使用 `createRoute` 定义 path、method、tags、request、responses
- 错误响应统一复用 `respErr`，HTTP 状态码来源 `stoker/http-status-codes`
- 请求/响应体使用 `jsonContent`/`jsonContentRequired` 包装 Zod Schema
- 路径前缀以模块名为准（item 使用 `/item`）

新增路由示例（缩减版，按需替换 Schema 与描述）：

```ts
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { insertItemSchema, selectItemSchema } from "@/db/schema";

export const respErr = z.object({ message: z.string() }).describe("错误响应");
const routePrefix = "/item";
const tags = [`${routePrefix} (物料)`];

export const list = createRoute({
  summary: "获取物料列表",
  path: routePrefix,
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectItemSchema),
      "一个物料列表"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      respErr,
      "查询参数验证错误"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      respErr,
      "服务器内部错误"
    ),
  },
});

export const create = createRoute({
  summary: "新增物料",
  path: routePrefix,
  method: "post",
  tags,
  request: { body: jsonContentRequired(insertItemSchema, "创建好的物料") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectItemSchema, "新增物料成功"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      respErr,
      "数据校验失败"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(respErr, "sort已存在"),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
```

## 处理实现：保持最小职责与类型安全（照抄 itme.handlers.ts 模式）

关键要点：

- `RouteHandler` 泛型约束返回值与 `ctx.req.valid()` 请求体验证
- 所有数据库操作通过 `@/db` 的默认导出访问
- 成功统一返回 200/OK，错误返回对应的 OpenAPI 声明状态

示例：

```ts
import type { RouteConfig, RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import db from "@/db";
import { items } from "@/db/schema";
import type { CreateRoute, ListRoute } from "./item.routes";

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R>;

export const list: AppRouteHandler<ListRoute> = async (ctx) => {
  const itemList = await db.query.items.findMany();
  return ctx.json(itemList, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (ctx) => {
  const item = ctx.req.valid("json");
  const [inserted] = await db.insert(items).values(item).returning();
  return ctx.json(inserted, HttpStatusCodes.OK);
};
```

## 模块装配：仅负责绑定（照抄 routes/item/index.ts 模式）

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import * as routes from "./item.routes";
import * as handlers from "./itme.handlers";

const router = new OpenAPIHono()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create);

export default router;
```

## 数据库范式：以 src/db/schema/item 为唯一模板

关键要点：

- 统一使用 `app` schema：`pgSchema('hono-app')`
- 表创建统一放置在 `src/db/schema/<module>/<table>.ts`
- 使用 `drizzle-zod` 派生 select/insert/update Zod Schema，并为 OpenAPI 添加描述
- 主键优先使用 `uuid().defaultRandom()`；若使用需确保启用 `pgcrypto`

示例片段：

```ts
import { integer, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { app } from "../app-schema";

export const items = app.table("item", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar({ length: 64 }).notNull(),
  payload: text(),
  sort: integer("sort").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const selectItemSchema = createSelectSchema(items);
export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
});
export const updateItemSchema = createUpdateSchema(items).pick({
  name: true,
  payload: true,
  sort: true,
});
export const deleteItemSchema = z.object({ id: z.uuid() });
```

## 迁移与目录：以 drizzle.config.ts 为准

- 迁移配置位于 `./drizzle.config.ts`，输出目录固定为 `./drizzle/migrations`
- 初次克隆后先执行：

```bash
bun run db:generate
bun run db:migrate
```

若缺少目录，可手动创建：

```bash
mkdir -p drizzle/migrations
```

## 禁止事项

- 不要使用与 `item` 模块不一致的路由装配方式
- 不要越过 `@/db` 直接创建数据库连接
- 不要在 handler 内堆积复杂业务，提取到独立服务文件再调用
- 不要绕过 Zod/OpenAPI 契约直接返回任意 JSON

遵循以上唯一范式，AI 生成的增量改动将与项目保持一致、可维护且可被 OpenAPI 正确描述。
