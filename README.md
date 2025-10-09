# Hono in Bun

这是一个使用 Bun、Hono 和 TypeScript 构建的 Web 后端项目模板。它集成了 OpenAPI (Scalar UI) 文档、日志记录、中间件和结构化的路由。

## 技术栈

- 运行时: Bun
- Web 框架: Hono
- 类型检查与 OpenAPI: Zod & @hono/zod-openapi
- API 文档: @scalar/hono-api-reference
- 日志: Pino
- 代码格式化与 Lint: Biome
- 环境变量: dotenv

## 项目结构

```
.
├── Dockerfile           # Docker 配置文件
├── README.md            # 项目说明
├── bun.lockb            # Bun 依赖锁定文件
├── package.json         # 项目依赖和脚本
├── tsconfig.json        # TypeScript 配置
├── drizzle.config.ts    # drizzle-kit 配置文件
├── drizzle/             # Drizzle ORM 迁移文件
├── src/
│   ├── app.ts           # Hono 应用核心，组装中间件和路由
│   ├── server.ts        # Bun 服务器入口
│   ├── env.ts           # 环境变量处理
│   ├── db/              # 数据库连接和 schema
│   ├── libs/            # 应用的核心库和辅助函数
│   │   ├── config-open-api.ts # OpenAPI (Scalar) 配置
│   │   ├── create-app.ts      # Hono 实例创建和通用中间件
│   │   ├── logger.ts          # 日志配置
│   │   └── types.ts           # 全局类型定义
│   ├── middlewares/     # 自定义中间件
│   │   ├── jwt.ts              # JWT 认证 (示例)
│   │   ├── request-logger.ts   # 请求日志
│   │   └── set-headers.ts      # 设置响应头
│   └── routes/          # 路由模块
│       └── item/        # 'item' 模块示例
│           ├── index.ts         # 组合路由和处理器
│           ├── item.routes.ts   # 定义路由、输入输出 schema
│           └── itme.handlers.ts # 路由的业务逻辑实现
└── test/                # 测试文件
```

## 快速开始

1. 安装依赖

```bash
bun install
```

2. 启动开发服务器

```bash
bun run dev
```

服务器将在 http://localhost:3002 启动，并支持热重载。

3. API 文档

访问 http://localhost:3002/reference 查看由 Scalar 生成的 API 文档。

## 数据库集成（PostgreSQL + Drizzle ORM）

本模板已经预装了 Drizzle ORM、drizzle-kit、postgres 驱动，并提供了可直接使用的配置文件和示例代码。按照下列步骤即可完成数据库初始化与迁移。

1. 准备环境变量

- 在项目根目录创建 .env，至少包含 DATABASE_URL，例如：

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/hono_app
```

- 其他变量可参考 src/env.ts 中的 Zod 校验，确保与运行环境匹配。

2. 数据库客户端定义（src/db/index.ts）

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import env from "@/env";
import * as schema from "./schema";

// 创建 Postgres 连接客户端
const queryClient = postgres(env.DATABASE_URL, {
  // 默认最大连接数
  max: 10,
  // 空闲连接保留时间，10s
  idle_timeout: 10,
  // 连接超时时间，30s
  connect_timeout: 30,
  transform: {
    // 处理 JS undefined 转 SQL NULL
    undefined: null,
  },
});

// 组装 Drizzle ORM 实例
const db = drizzle({
  client: queryClient,
  schema,
  // 自动在数据库使用 snake_case 命名风格
  casing: "snake_case",
  // 本地开发环境打印 SQL 日志
  logger: env.NODE_ENV !== "production",
});

export default db;
```

使用时直接 `import db from '@/db'`，即可在 handler 或服务层调用。

3. Schema 组织（src/db/schema）

- app-schema.ts 统一定义 schema 前缀，确保所有表在 `hono-app` 命名空间内：

```ts
import { pgSchema } from "drizzle-orm/pg-core";

export const app = pgSchema("hono-app");
// 迁移 SQL 生成后，如需在数据库中提前创建 schema 与扩展，请手动在 SQL 顶部补充：
//   CREATE SCHEMA IF NOT EXISTS "hono-app";
//   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

- item 模块的表结构与 Zod Schema 位于 `src/db/schema/item/item.ts`，是新增表的范例：

```ts
import { integer, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { app } from "../app-schema";

// item 表的字段描述
export const items = app.table("item", {
  // 使用 uuid 需要启用 gen_random_uuid()
  //   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar({ length: 64 }).notNull(),
  payload: text(),
  sort: integer("sort").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const selectItemSchema = createSelectSchema(items, {
  id: (schema) => schema.meta({ description: "物料唯一编码" }),
  name: (schema) => schema.meta({ description: "物料名称" }),
  payload: (schema) =>
    schema.meta({ description: "物料不知道为啥有的一个字段" }),
  sort: (schema) => schema.meta({ description: "物料排序字段" }),
});

export const insertItemSchema = createInsertSchema(items, {
  name: (filed) => filed.min(1).max(64),
  sort: (filed) => filed.int().nonnegative(),
}).omit({ id: true, createdAt: true });

export const updateItemSchema = createUpdateSchema(items).pick({
  name: true,
  payload: true,
  sort: true,
});

export const deleteItemSchema = z.object({
  id: z.uuid(),
});
```

- 新表请保持同样的结构化注释与 Zod 集成，以便自动生成 OpenAPI 文档。

4. 迁移配置与目录生成

- drizzle.config.ts 已预先配置好输入输出路径：

```ts
import { defineConfig } from "drizzle-kit";
import env from "@/env";

export default defineConfig({
  schema: "./src/db/schema",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
```

- package.json 中提供了脚本：

```bash
bun run db:generate
bun run db:migrate
```

- 注意：初次克隆仓库后务必执行 `bun run db:generate`，以生成或更新 `drizzle/migrations` 目录；若跳过此步骤，Drizzle 在执行迁移时会因为目录缺失而报错。必要时也可以手动运行：

```bash
mkdir -p drizzle/migrations
```

5. 在业务代码中使用

- 参考 `src/routes/item/itme.handlers.ts` 中的实现：

```ts
const itemList = await db.query.items.findMany();
const item = ctx.req.valid("json");
const [inserted] = await db.insert(items).values(item).returning();
```

- 对应的请求体验证与响应 Schema 位于 `src/routes/item/item.routes.ts`，请确保与数据库 Schema 同步。

完成以上准备后即可运行 `bun run dev`，并通过 `/item` 路由验证数据库读写是否正常。

## 常见问题 / 故障排查

1. 环境变量校验失败（启动时提示 Zod 错误）

- 现象：控制台输出“环境变量错误”，并列出缺失字段。
- 解决：在项目根目录 `.env` 中补齐 `DATABASE_URL`、`JWT_SECRET`、可选的 `PORT`、`LOG_LEVEL` 等；变量约束见 `src/env.ts`。

2. 执行迁移时报目录不存在

- 现象：`drizzle-kit migrate` 提示找不到迁移目录。
- 解决：先运行生成命令或手动创建目录：

```bash
bun run db:generate
mkdir -p drizzle/migrations
```

3. 使用 uuid 默认值时报错提示 `gen_random_uuid` 不存在

- 现象：插入/迁移时报函数不存在。
- 解决：为数据库启用扩展（需要足够权限）：

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

4. 无法连接数据库（ECONNREFUSED/ETIMEDOUT）

- 检查 `DATABASE_URL` 主机、端口、用户名、密码、数据库名是否正确。
- 本机 Postgres 是否已启动、是否允许外部连接（容器/防火墙设置）。
- 云数据库需确认白名单与 SSL 要求（必要时在连接串中追加参数）。

5. 端口被占用导致服务启动失败

- 现象：本地 3002 已被占用。
- 解决：在 `.env` 中设置 `PORT=3003`（或其他未占用端口），重新启动。

6. OpenAPI 页面无法访问或无接口

- 确认应用已调用 `configureOpenApi(app)` 并且服务正常启动。
- 新增模块需正确在 `src/app.ts` 中挂载路由，才能出现在 `/reference`。
