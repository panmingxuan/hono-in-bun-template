# 🧠 AI 协作与 Ultracite Agents 统一开发规范

> 本文档结合 **Ultracite Agents 初始化规范** 与 **AI 协作开发原则**，  
> 用于指导 AI 在项目中的行为模式、代码生成逻辑与架构准则。
>
> 目标：通过 **原则约束（设计思想） + 行为约束（执行规则）** 的双层体系，  
> 实现 AI 与人类工程师在高一致性、高可维护性的前提下协作开发。

---

## 🩵 第一部分：AI 协作开发原则（Architecture Principles）

原则导向 —— 让 AI 理解“为什么”而不仅是“怎么做”。

---

### 一、模块自治原则（Single Responsibility Principle）

> 每个模块承担单一职责，内部逻辑分层清晰。

**目标**

- 降低耦合、提升可维护性。
- 确保路由契约、处理实现、Schema 定义三者独立而协同。

**实践**

- 路由定义、Handler 实现、Schema 定义三层结构固定。
- 模块对外仅暴露 `router`。
- 模块示例可参考 `src/routes/item`。

---

### 二、契约优先原则（Interface Segregation Principle）

> 一切交互以显式契约为中心。

**目标**

- 保证类型安全与 API 自描述性。
- 实现可验证、可文档化的接口。

**实践**

- 使用 `@hono/zod-openapi` 定义契约。
- 响应体与错误体均基于 Zod Schema 定义。
- 禁止绕过契约直接操作请求或响应。

---

### 三、依赖隔离原则（Dependency Inversion Principle）

> 模块不依赖底层实现，而是依赖抽象。

**目标**

- 解耦业务逻辑与基础设施。
- 统一资源访问方式。

**实践**

- 所有数据库访问通过 `@/db` 默认实例。
- 所有模块装配通过 `index.ts` 完成。

---

### 四、显式错误与响应原则（Open/Closed Principle）

> 所有状态码与错误结构必须显式声明。

**目标**

- 提升系统可预测性与测试性。
- 让 OpenAPI 精准反映行为。

**实践**

- 所有错误使用 `respErr` Schema。
- 所有成功响应与 Schema 类型对应。

---

### 五、结构一致性原则（Consistency Principle）

> 命名、目录与导入路径保持统一。

**实践**

- `routes/<module>`、`db/schema/<module>` 目录层级固定。
- 文件命名格式统一：`<module>.routes.ts`、`<module>.handlers.ts`。
- Schema 命名采用 `selectXxxSchema` / `insertXxxSchema`。

---

### 六、最小可变原则（Liskov Substitution Principle）

> 优先复用与替换，而非重写。

**实践**

- 通过更换 Schema 与描述实现新功能。
- 禁止重复创建已有 CRUD 模式。

---

### 七、迁移透明原则（Infrastructure Isolation Principle）

> 所有数据库变更必须可追溯、可回滚。

**实践**

- 使用 `drizzle.config.ts` 管理迁移。
- 输出目录固定 `drizzle/migrations`。
- 禁止执行手写 SQL 修改表结构。

---

### 八、AI 协作透明原则（Explainability Principle）

> AI 生成内容必须可读、可验证、可解释。

**实践**

- 每段生成代码应可追溯来源。
- 禁止生成黑箱式逻辑。
- 所有生成结果应对齐既有架构模式。

---

## 🧩 第二部分：Ultracite Agents 行为规范（Execution Rules）

执行导向 —— 让 AI 理解“必须遵守的底线与格式”。

---

### 1. Core Principles

- 零配置启动（`npx ultracite init`）
- 亚秒级性能
- 强类型安全（TypeScript）
- 面向 AI 生成的代码一致性保障

---

### 2. 行为守则层级

#### a. Accessibility (a11y)

AI 生成前端代码时：

- 禁止误用 ARIA 属性、role、tabIndex。
- 所有 `<button>` 必须声明 `type`。
- 所有 `<svg>` 元素包含 `<title>`。
- 图像 `alt` 属性不应包含 “image/picture/photo”。
- 所有交互元素必须可聚焦（focusable）。
- HTML `<html>` 标签必须含 `lang` 属性。
- `<iframe>` 元素需带 `title`。

#### b. Code Complexity and Quality

AI 在生成逻辑时：

- 避免深层嵌套与复杂逻辑。
- 禁止使用 `arguments`、`any`、`unknown`。
- 使用 `for...of` 代替 `Array.forEach`。
- 避免空结构、无用 import、未使用变量。
- 优先采用函数式表达与纯逻辑。

#### c. React / JSX 约束

- Hook 调用必须位于组件顶层。
- 不得使用数组下标作为 key。
- 禁止 `children` 与 `dangerouslySetInnerHTML` 并用。
- 所有组件必须有明确 Props 类型。
- 禁止嵌套定义组件或在 render 内声明函数。

#### d. TypeScript Best Practices

- 不使用 `enum` / `namespace`。
- 所有类型导出使用 `export type`。
- 明确类型边界，禁止隐式 any。
- 一律使用 `import type` 引入类型。
- 不使用非空断言 `!` 除非可证明安全。

#### e. Style and Consistency

- 使用 `const` 声明只读变量。
- 禁止使用 `var`、`eval`、`with`、`console.log`。
- 使用模板字符串代替拼接。
- 禁止冗余括号、空块、重复条件。
- 保持 Biome / Ultracite 自动格式化风格。

#### f. Testing & Error Handling

- 禁止使用 `focused` 或 `disabled` 测试。
- 测试断言必须在 `it()` 内执行。
- 所有异常必须显式捕获与记录。
- 不得吞掉错误（避免空 `catch` 块）。

---

## ⚙️ 第三部分：协作策略（AI & Human Co-Development）

> 人类编写「约束」，AI 负责「对齐生成」。

**目标**

- 让 AI 自动在正确范式中生成可维护代码。
- 让人类在审阅时无需关注低级错误，而只聚焦逻辑正确性。

**规则**

1. 所有模块生成前，AI 应先扫描现有模式并推断依赖关系。
2. 所有新代码均须通过 `ultracite check` 校验。
3. 生成后自动运行 `ultracite fix` 格式化。
4. 不得引入新的全局依赖或打破现有导入结构。
5. 若需扩展功能，应以原则为边界，不修改底层实现。

---

## 🔚 总结

这份规范定义了一个“双轨制协作系统”：

- **上轨：原则驱动（AI 协作开发原则）**  
  → 保证架构一致性与长期可维护性。
- **下轨：规则约束（Ultracite Agents 行为规范）**  
  → 保证执行层面的安全与一致。

AI 与工程师在此体系下协作，将能产出具备：

- 统一范式
- 强类型保证
- 可溯源错误
- 高度可维护性的现代代码库。

---
