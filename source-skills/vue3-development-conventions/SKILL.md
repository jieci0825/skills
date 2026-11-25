---
name: vue3-development-conventions
description: 编写、修改、重构或审查 Vue 3 单文件组件、模板、组件通信及 Composable 时使用。规范 SFC 与 script setup 的组织、派生状态、模板属性顺序、状态归属和 Vue 样式隔离。
---

# Vue 3 开发规范

先确认目标项目的 Vue 版本、Lint 和格式化配置，以及同目录已有写法。以下约定用于新增代码和本次修改涉及的部分。项目明确约定、公开组件契约和运行时行为优先。文件命名和 ES Module 导入导出分别沿用 `naming-conventions` 和 `import-export-conventions` 的适用规则。

## 单文件组件与脚本

- SFC 按 `script → template → style` 排列，相邻区块间留一个空行，只创建有实际内容的区块。新增组件默认使用 `<script setup>`，TypeScript 项目的脚本块使用 `lang="ts"`。既有组件按实际修改范围处理。
- 脚本默认顺序为导入 → 局部类型 → 组件选项 → 组件契约 → 依赖实例 → 常量 → 状态及模板引用 → 派生状态 → 函数 → 监听 → 生命周期 → 暴露接口。仅组织实际存在的内容。复杂组件可将搜索、表格、分页、弹窗等各自的状态、派生值和操作集中组织。依赖初始化、监听触发和宏执行时序优先于默认排布。
- 命名的响应式派生值优先用 `computed`，直接从源状态计算，避免维护需要同步的副本。getter 只做计算。网络请求、状态写入和 DOM 操作应放在事件处理、监听或合适的生命周期中。
- 编写、重排或审查脚本及派生值时，读 [SFC 与脚本](references/sfc-and-script.md) 的 Good / Bad 和版本示例。

## 模板

- 简单属性访问、布尔判断和轻量的纯格式化调用可直接写在模板里。将多步数据转换和复杂业务条件移到脚本中，保持渲染表达式无副作用。简单事件监听可直接调用处理函数或发送组件事件。
- 属性默认按结构性指令 → 标识及引用 → 双向绑定 → 组件属性 → 样式属性 → 事件监听排列。保留对象式 `v-bind`、`v-on` 等已有的覆盖和监听顺序。
- 编写或整理模板时，读 [模板表达式与属性顺序](references/templates.md)。

## 组件通信

按数据所有者、使用范围和交互意图选择接口。父传子用 Props，子通知父用 Emits，受控值用 `v-model`，传入视图用 Slots，子树上下文用 Provide / Inject。兄弟组件优先通过共同父组件协调，多个页面共享同一份业务状态时沿用项目的 Store。聚焦等命令式操作可用 Template Ref + `defineExpose`。为简单的组件间传递优先使用 Props 和 Emits。实现或审查通信时，读 [组件通信](references/component-communication.md) 对应场景的示例。

## Composable

有复用价值或具备独立职责的响应式逻辑可以抽为 Composable。简单组件逻辑留在组件内，纯工具函数用普通函数。状态默认在每次调用内创建。组件生命周期钩子在 setup 阶段注册，外部监听、定时器和订阅按作用域清理。只返回调用方所需的状态和操作。抽取或审查时，读 [Composable](references/composables.md)。

## 样式

组件局部样式默认使用 `scoped` 或项目已有的隔离机制，全局样式集中管理。定制子组件时优先使用公开样式属性、CSS 变量或主题机制。确需穿透时，将 `:deep()` 限定在组件局部范围。沿用项目的 CSS、SCSS、Less、Tailwind CSS 等方案。修改 Vue 样式隔离或第三方组件样式时，读 [Vue 样式机制](references/sfc-styles.md)。
