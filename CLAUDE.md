# AI 协作开发原则：架构一致性与模块自治指南

本文件将原有的硬性“唯一范式”约束，转化为以 **SOLID 原则**、**可维护架构思想** 为基础的 **设计指导准则**。  
目标是在保持一致性的前提下，允许 AI 与开发者以“原则驱动”方式进行模块扩展与迭代。

---

## 一、模块自治原则（Single Responsibility Principle）

> 每个模块应承担清晰且单一的业务职责，内部逻辑分层且边界明确。

**设计目标**

- 降低耦合、提升可读性与可维护性。
- 确保路由契约、处理实现、数据库定义彼此独立但协作一致。

**实践方式**

- 路由定义、Handler 实现、Schema 定义三者独立成层。
- 模块对外只暴露 router，不应混杂数据层逻辑。
- `item` 模块是结构与职责边界的参考实现。

---

## 二、契约优先原则（Interface Segregation Principle）

> 所有接口交互以“契约（Contract）”为核心，契约是类型安全与行为一致的基础。

**设计目标**

- 强化 API 自描述能力。
- 让验证、文档与实现保持同构。

**实践方式**

- 使用 `@hono/zod-openapi` 定义 API 契约。
- 每个请求与响应结构应通过 Zod Schema 显式声明。
- 错误与成功响应均以 Schema 表达，而非自由 JSON。

**示例要点**

- 路由声明使用 `createRoute`。
- 响应体使用 `jsonContent` / `jsonContentRequired`。
- 错误结构复用 `respErr`，状态码来源统一自 `stoker/http-status-codes`。

---

## 三、依赖隔离原则（Dependency Inversion Principle）

> 访问外部资源（数据库、API）时，应通过统一封装层实现，而非直接依赖底层细节。

**设计目标**

- 解耦业务逻辑与基础设施实现。
- 保证模块迁移与测试的可控性。

**实践方式**

- 所有数据库操作通过 `@/db` 暴露的默认实例访问。
- 禁止在 handler 内部直接创建连接或实例化外部依赖。
- 模块装配通过统一 `index.ts` 进行注册与导出。

---

## 四、显式错误与响应原则（Open/Closed Principle）

> 所有可能的响应状态与错误类型都应在设计阶段明确定义。

**设计目标**

- 避免意料之外的返回结构。
- 增强 OpenAPI 的准确性与可测试性。

**实践方式**

- 响应结构、错误结构、状态码均在契约层声明。
- 遵循「定义即行为」：声明的结构即实现返回的结构。
- 所有未定义错误一律视为 `INTERNAL_SERVER_ERROR`。

---

## 五、结构一致性原则（Consistency Principle）

> 模块的目录结构、文件命名与导入路径应保持统一，以利协作与 AI 自动生成。

**设计目标**

- 让每个模块可通过相同范式扩展。
- 降低上下文切换与风格偏移。

**实践方式**

- 目录层级：`routes/<module>`, `db/schema/<module>`。
- 文件命名：`<module>.routes.ts`, `<module>.handlers.ts`, `index.ts`。
- Schema 命名统一为 `selectXxxSchema`, `insertXxxSchema`, `updateXxxSchema`。

---

## 六、最小可变原则（Liskov Substitution Principle）

> 优先通过替换 Schema、扩展契约来创建新功能，而非复制与重写。

**设计目标**

- 复用已有的模式与类型体系。
- 保持行为一致的同时，允许语义层扩展。

**实践方式**

- 新模块可基于现有 CRUD 模板实现扩展。
- 仅修改 Schema、路径与描述部分，不破坏整体结构。
- 所有派生逻辑应可被既有类型安全机制覆盖。

---

## 七、迁移透明原则（Infrastructure Isolation Principle）

> 数据库结构演进必须可追溯、可回滚。任何迁移都应通过统一工具生成。

**设计目标**

- 确保团队协作中数据库状态一致。
- 保持历史版本的可恢复性。

**实践方式**

- 使用 `drizzle.config.ts` 管理迁移配置。
- 迁移输出目录固定为 `./drizzle/migrations`。
- 不允许执行手写 SQL 修改结构。
- 初始化命令：
  ```bash
  bun run db:generate
  bun run db:migrate
  ```
