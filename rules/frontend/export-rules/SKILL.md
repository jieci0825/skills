---
name: export-rules
description: 规范 TypeScript / Vue 项目中的模块导出方式，包括命名导出优先、桶导出（barrel export）组织、类型导出分离、export default 受限使用以及导出排序。在编写或修改任何 .ts / .vue 文件的 export 语句时自动应用。
---

# 导出规则

## 一、命名导出优先

模块对外暴露的函数、常量、对象等，**必须使用命名导出**，禁止无理由使用 `export default`。

示例见 [named-export.md](references/named-export.md)

---

## 二、桶导出（Barrel Export）

当目录包含多个子模块时，必须通过 `index.ts` 统一聚合导出。根据场景选择合适的再导出形式：

- **命名空间聚合**：`export * as xxxApi from './modules/xxx'`
- **选择性再导出**：`export { a, b } from './file'`
- **完整再导出**：`export * from './file'`（仅当子模块导出不会产生命名冲突时使用）

示例见 [barrel-export.md](references/barrel-export.md)

---

## 三、类型导出分离

类型定义使用 `export interface` 或 `export type` 直接导出；桶文件中再导出类型时，必须使用 `export type { ... } from` 语法，与值导出分开书写。

示例见 [type-export.md](references/type-export.md)

---

## 四、export default 受限使用

`export default` **仅限**以下场景使用：

- 模块单例实例（如封装后的请求实例、日志实例）
- 应用配置对象
- 路由定义（`*.route.ts`）
- 应用工厂函数（如 `createApp`）

除上述场景外，一律使用命名导出。

示例见 [default-export.md](references/default-export.md)

---

## 五、导出排序

同一文件中包含多种导出时，按以下顺序排列，组与组之间用**空行**分隔：

1. **常量 / 变量导出**
2. **函数导出**
3. **类型导出**（`export type` / `export interface`）

桶文件（`index.ts`）中的再导出排列顺序：

1. **命名空间再导出**（`export * as`）
2. **值再导出**（`export { ... } from` / `export * from`）
3. **类型再导出**（`export type { ... } from`）

示例见 [export-order.md](references/export-order.md)
