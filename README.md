# Hono in Bun

这是一个使用 Bun、Hono 和 TypeScript 构建的高性能 Web 后端项目模板。它集成了 OpenAPI (Swagger) 文档、日志记录、中间件和结构化的路由。

## 技术栈

- **运行时**: [Bun](https://bun.sh/)
- **Web 框架**: [Hono](https://hono.dev/)
- **类型检查与 OpenAPI**: [Zod](https://zod.dev/) & `@hono/zod-openapi`
- **API 文档**: `@scalar/hono-api-reference`
- **日志**: [Pino](https://getpino.io/)
- **代码格式化与 Lint**: [Biome](https://biomejs.dev/)
- **环境变量**: `dotenv`

## 项目结构

```
.
├── Dockerfile          # Docker 配置文件
├── README.md           # 项目说明
├── bun.lockb           # Bun 依赖锁定文件
├── package.json        # 项目依赖和脚本
├── tsconfig.json       # TypeScript 配置
├── drizzle/            # Drizzle ORM 配置文件和迁移
├── src/
│   ├── app.ts          # Hono 应用核心，组装中间件和路由
│   ├── server.ts       # Bun 服务器入口
│   ├── env.ts          # 环境变量处理
│   ├── db/             # 数据库连接和 schema
│   ├── libs/           # 应用的核心库和辅助函数
│   │   ├── config-open-api.ts # OpenAPI (Scalar) 配置
│   │   ├── create-app.ts      # Hono 实例创建和通用中间件
│   │   ├── logger.ts          # 日志配置
│   │   └── types.ts           # 全局类型定义
│   ├── middlewares/    # 自定义中间件
│   │   ├── jwt.ts             # JWT 认证 (示例)
│   │   ├── request-logger.ts  # 请求日志
│   │   └── set-headers.ts     # 设置响应头
│   └── routes/         # 路由模块
│       └── item/       # 'item' 模块示例
│           ├── index.ts         # 组合路由和处理器
│           ├── item.routes.ts   # 定义路由、输入输出 schema
│           └── itme.handlers.ts # 路由的业务逻辑实现
└── test/               # 测试文件
```

## 快速开始

1.  **安装依赖**

    ```bash
    bun install
    ```

2.  **启动开发服务器**

    ```bash
    bun run dev
    ```

    服务器将在 `http://localhost:3000` 启动，并支持热重载。

3.  **API 文档**
    访问 `http://localhost:3000/doc` 查看由 Scalar 生成的 API 文档。

## 数据库集成 (PostgreSQL 示例)

本项目推荐使用 `drizzle-orm`，一个高性能的 TypeScript ORM。

1.  **安装依赖**

    ```bash
    bun add drizzle-orm postgres
    bun add -d drizzle-kit
    ```

    - `drizzle-orm`: Drizzle 核心库
    - `postgres`: Node.js 的 PostgreSQL 客户端
    - `drizzle-kit`: 用于生成和管理数据库迁移

2.  **配置数据库连接**

    在 `src/db/` 目录下创建 `index.ts` 文件：

    ```typescript
    // src/db/index.ts
    import { drizzle } from "drizzle-orm/postgres-js";
    import postgres from "postgres";
    import * as schema from "./schema";

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }

    // For query client
    const queryClient = postgres(connectionString);
    export const db = drizzle(queryClient, { schema });
    ```

3.  **定义 Schema**

    在 `src/db/` 目录下创建 `schema.ts` 文件：

    ```typescript
    // src/db/schema.ts
    import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

    export const users = pgTable("users", {
      id: serial("id").primaryKey(),
      fullName: text("full_name"),
      phone: varchar("phone", { length: 256 }),
    });
    ```

4.  **生成迁移文件**

    首先，在项目根目录创建 `drizzle.config.ts`：

    ```typescript
    // drizzle.config.ts
    import type { Config } from "drizzle-kit";

    export default {
      schema: "./src/db/schema.ts",
      out: "./drizzle",
      driver: "pg",
      dbCredentials: {
        connectionString: process.env.DATABASE_URL!,
      },
    } satisfies Config;
    ```

    然后，在 `package.json` 中添加脚本：

    ```json
    "scripts": {
      // ...
      "db:generate": "drizzle-kit generate",
      "db:migrate": "bun run src/db/migrate.ts"
    }
    ```

    运行生成命令：

    ```bash
    bun run db:generate
    ```

5.  **执行迁移**

    创建 `src/db/migrate.ts` 文件来运行迁移：

    ```typescript
    // src/db/migrate.ts
    import { migrate } from "drizzle-orm/postgres-js/migrator";
    import { drizzle } from "drizzle-orm/postgres-js";
    import postgres from "postgres";

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }

    const sql = postgres(connectionString, { max: 1 });
    const db = drizzle(sql);

    await migrate(db, { migrationsFolder: "drizzle" });

    console.log("Migrations applied successfully!");
    await sql.end();
    ```

    运行迁移脚本：

    ```bash
    bun run db:migrate
    ```

现在，你的应用已经成功连接到 PostgreSQL 数据库，并且可以使用 `db` 实例进行查询。
