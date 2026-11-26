---
name: vue3-development-conventions
description: 编写、修改、重构或审查 Vue 3 单文件组件、模板、组件通信及 Composable 时使用。规范 SFC 与 script setup 的组织、派生状态、模板属性顺序、状态归属和 Vue 样式隔离。
---

# Vue 3 开发规范

先查项目的 Vue 版本、Lint、格式化配置和同目录写法。规范用于新增和本次涉及的代码，项目明确约定、公开组件契约及运行时行为优先。文件命名和 ES Module 导入导出分别遵循 `naming-conventions` 和 `import-export-conventions` 的适用规则。

## 单文件组件与脚本

- SFC 按 `script → template → style` 排列，仅保留有内容的区块，区块间空一行。新组件默认用 `<script setup>`，TS 项目的脚本块用 `lang="ts"`。
- 脚本默认按导入 → 局部类型 → 组件选项 → 组件契约 → 依赖实例 → 常量 → 状态及模板引用 → 派生状态 → 函数 → 监听 → 生命周期 → 暴露接口组织。复杂组件可按搜索、表格、分页、弹窗等功能集中组织各自的状态、派生值和操作。依赖初始化、监听触发和宏时序优先。
- 命名的响应式派生值优先用 `computed` 从源状态计算，避免同步副本。getter 只做计算，网络请求、状态写入和 DOM 操作放在事件处理、监听或合适的生命周期中。
- 编写、重排或审查脚本及派生值时读[SFC 与脚本](references/sfc-and-script.md)。

## 模板

简单属性访问、布尔判断和轻量纯格式化可内联，多步转换和复杂业务条件移到脚本。渲染保持无副作用，简单事件可直接调用处理函数或发送组件事件。属性默认按结构性指令 → 标识及引用 → 双向绑定 → 组件属性 → 样式属性 → 事件监听排列。保留对象式 `v-bind`、`v-on` 等的覆盖和监听顺序。编写或整理模板时读[模板表达式与属性顺序](references/templates.md)。

## 组件通信

按数据所有者、使用范围和交互意图选择方式。简单传递优先用 Props（父传子）和 Emits（子通知父），受控值用 `v-model`，传入视图用 Slots，子树上下文用 Provide / Inject。兄弟组件优先由共同父组件协调，跨页面共享业务状态沿用项目 Store，聚焦等命令式操作可用 Template Ref + `defineExpose`。实现或审查时读[组件通信](references/component-communication.md)的对应场景。

## Composable

可复用或有独立职责的响应式逻辑可抽取。简单组件逻辑留在组件，纯工具用普通函数。每次调用默认创建独立状态，在 setup 注册组件生命周期钩子，按作用域清理外部监听、定时器和订阅，只返回调用方所需的状态和操作。抽取或审查时读[Composable](references/composables.md)。

## 样式

局部样式默认用 `scoped` 或项目已有的隔离机制，全局样式集中管理。定制子组件优先用公开样式属性、CSS 变量或主题，确需 `:deep()` 时限定局部范围。沿用项目的样式技术。修改 Vue 样式隔离或第三方组件样式时读[Vue 样式机制](references/sfc-styles.md)。
