# AI 协作指南：API 层开发规范

本文档为 AI 提供了在本 Hono 项目中如何高效、规范地创建 API 接口的详细指南。请严格遵循以下约定和步骤。

## 核心理念

API 开发遵循“关注点分离”原则，将路由定义、业务逻辑和模块组装拆分到不同的文件中。每个 API 模块（例如 `item`）都包含三个核心文件：

1.  `*.routes.ts`: **路由契约层**。定义 API 的所有元数据，包括路径、HTTP 方法、参数、请求体、响应格式以及 OpenAPI 文档信息。此文件**不包含**任何业务逻辑。
2.  `*.handlers.ts`: **业务逻辑层**。实现路由的具体功能。它接收请求上下文 (`ctx`)，执行操作，并返回响应。
3.  `index.ts`: **模块组装层**。将路由定义和业务逻辑处理器连接起来，并导出 Hono 实例。

以 `item` 模块为例，我们来看看这三个文件如何协同工作。

## 1. `item.routes.ts` - 定义路由契约

此文件的核心职责是使用 `@hono/zod-openapi` 的 `createRoute` 函数来定义一个或多个路由。

```typescript
// src/routes/item/item.routes.ts

import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

// 1. 定义数据结构 Schema (如果需要)
// 使用 Zod 定义清晰的数据类型，用于请求和响应。
const ItemSchema = z.object({
  id: z.string().openapi({ example: "1" }),
  name: z.string().openapi({ example: "Sample Item" }),
  // ... 其他字段
});

// 2. 定义路由
export const list = createRoute({
  // OpenAPI 元数据
  summary: "获取物料列表",
  description: "返回所有可用的物料。",
  tags: ["Item"],

  // 路由核心定义
  method: "get",
  path: "/items", // 建议使用复数形式

  // 定义响应格式
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(ItemSchema), // 使用 Zod Schema
      "成功获取物料列表"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "服务器内部错误"
    ),
  },
});

// 3. 导出路由类型，供 handler 使用
export type ListRoute = typeof list;
```

**关键点**:

- **只定义，不实现**：此文件是纯声明式的。
- **强类型**：使用 Zod 为所有输入和输出定义严格的 Schema。这不仅能提供自动验证，还能生成准确的 OpenAPI 文档。
- **OpenAPI 文档**：`summary`, `description`, `tags` 等字段会自动用于生成 `/doc` 页面。
- **导出类型**：导出路由的类型 (`typeof list`)，以便在 `handlers.ts` 中获得类型提示。

## 2. `itme.handlers.ts` - 实现业务逻辑

此文件负责实现 `*.routes.ts` 中定义的路由的逻辑。

```typescript
// src/routes/item/itme.handlers.ts

import type { RouteConfig, RouteHandler } from "@hono/zod-openapi";
// 1. 导入在 .routes.ts 中定义的路由类型
import type { ListRoute } from "./item.routes";
import { db } from "@/db"; // 假设已配置数据库

// 2. 定义一个通用的 Handler 类型 (可选，但推荐)
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R>;

// 3. 实现业务逻辑
export const list: AppRouteHandler<ListRoute> = async (ctx) => {
  try {
    // 示例：从数据库查询数据
    const items = await db.query.items.findMany();
    return ctx.json(items);
  } catch (error) {
    // 记录错误
    ctx.get("logger").error(error);
    // 返回一个标准化的错误响应
    return ctx.json({ message: "Failed to fetch items" }, 500);
  }
};
```

**关键点**:

- **类型安全**：通过 `AppRouteHandler<ListRoute>`，`list` 函数的 `ctx.json()` 会自动检查返回值是否符合 `ListRoute` 中定义的响应 Schema。
- **依赖注入**：通过 `ctx.get('...')` 获取共享的实例，如 `logger`。
- **错误处理**：实现健壮的 `try...catch` 块，记录错误并返回符合 Schema 的错误响应。
- **保持精简**：如果逻辑变得复杂，应将其拆分到服务层 (`src/services/`)。Handler 只做数据转换和流程控制。

## 3. `index.ts` - 组装模块

这是将路由和处理器“粘合”在一起的地方。

```typescript
// src/routes/item/index.ts

/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */
import { OpenAPIHono } from "@hono/zod-openapi";
// 1. 导入所有路由定义和处理器
import * as routes from "./item.routes";
import * as handlers from "./itme.handlers";

// 2. 创建一个新的 Hono 实例
const router = new OpenAPIHono();

// 3. 将路由和处理器绑定
// .openapi(routeDefinition, handlerFunction)
router.openapi(routes.list, handlers.list);
// 如果有更多路由，继续绑定
// router.openapi(routes.create, handlers.create);
// router.openapi(routes.getById, handlers.getById);

// 4. 导出 router
export default router;
```

**关键点**:

- **单一职责**：此文件的唯一职责就是组装。
- **清晰映射**：`router.openapi(route, handler)` 的调用清晰地展示了哪个路由定义由哪个处理器实现。

## 4. `src/app.ts` - 挂载新模块

最后一步是将新创建的 API 模块挂载到主应用上。

```typescript
// src/app.ts

import { configureOpenApi } from "@/libs/config-open-api";
import createApp from "./libs/create-app";

// 1. 导入新创建的路由模块
import item from "@/routes/item";
import user from "@/routes/user"; // 假设你创建了一个新的 user 模块

const app = createApp();

configureOpenApi(app);

// 2. 将新模块添加到路由数组中
const routes = [item, user];

// 3. 循环挂载
for (const route of routes) {
  app.route("/", route);
}

export default app;
```

## 创建新 API 模块的完整流程

假设要创建一个新的 `product` 模块。

1.  **创建文件夹**: 在 `src/routes/` 下创建 `product` 文件夹。
2.  **创建 `product.routes.ts`**:
    - 定义 `ProductSchema`。
    - 使用 `createRoute` 定义 `listProducts`、`createProduct` 等路由。
    - 导出所有路由定义和它们的类型。
3.  **创建 `product.handlers.ts`**:
    - 导入 `product.routes.ts` 中的路由类型。
    - 为每个路由实现业务逻辑处理器 (`listProducts`, `createProduct` 等)。
    - 处理数据库交互和错误。
4.  **创建 `index.ts`**:
    - 导入 `product.routes.ts` 和 `product.handlers.ts`。
    - 创建一个 `OpenAPIHono` 实例。
    - 使用 `.openapi()` 将路由和处理器绑定。
    - 导出 `router`。
5.  **更新 `src/app.ts`**:
    - 导入 ` '@/routes/product'`。
    - 将其添加到 `routes` 数组中。

遵循此模式，AI 可以轻松理解项目结构并独立、规范地添加新的 API 功能。
