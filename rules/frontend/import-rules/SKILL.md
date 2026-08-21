---
name: import-rules
description: 规范 TypeScript / Vue 项目中的模块导入方式，包括路径别名优先、桶导入（barrel import）、类型导入分离、导入排序以及 API 模块的导入风格。在编写或修改任何 .ts / .vue 文件的 import 语句时自动应用。
---

# 导入规则

## 一、路径别名优先

项目已配置 `@/*` → `src/*`。当路径可用别名表达时，**必须使用别名**，禁止出现层级过深的相对路径。

> 同目录或仅一级父级（`./`、`../`）的引用允许使用相对路径。

示例见 [alias-path.md](references/alias-path.md)

---

## 二、桶导入（Barrel Import）

当模块提供了 `index.ts` 统一导出入口时，从该入口导入，不要深入子路径。

示例见 [barrel-import.md](references/barrel-import.md)

---

## 三、类型导入分离

值导入与类型导入必须分开书写，使用独立的 `import type` 语句。

示例见 [type-import.md](references/type-import.md)

---

## 四、导入排序

按以下三层顺序排列，层与层之间用**空行**分隔：

1. **第三方包**
2. **内部模块**（别名路径 `@/` 或相对路径）
3. **类型导入**（`import type`）

示例见 [import-order.md](references/import-order.md)

---

## 五、API 导入风格

API 模块统一通过 `@/api` 桶入口以**命名空间**方式导入，调用时使用 `xxxApi.method()` 风格。

示例见 [api-import.md](references/api-import.md)
