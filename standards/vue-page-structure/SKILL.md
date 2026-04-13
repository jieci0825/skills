---
name: vue-page-structure
description: 规范 Vue 3 页面的目录结构与组件拆分方式，遵循容器组件与展示组件分离原则。index.vue 仅作为入口组装各子模块，业务逻辑和 UI 片段必须拆分到 components/、hooks/ 等子目录中。在创建新页面、重构现有页面、或编写 Vue 组件时自动应用。
---

# Vue 页面结构规范

## 核心原则

1. **容器与展示分离** —— `index.vue` 只负责组装，不承载业务逻辑和大段模板。
2. **单个组件不超过 300 行** —— 超出即拆分。
3. **按职责拆分** —— 独立业务、可复用片段、复杂状态/副作用各自独立成模块。

## 目录结构

### 基础结构

```
dashboard/
  components/
    dashboard-header.vue
    dashboard-content.vue
    dashboard-footer.vue
  hooks/
    use-dashboard.ts
  index.vue
```

### 复杂业务结构

```
dashboard/
  components/            # 页面私有组件
  hooks/                 # 业务逻辑复用（composable）
  config/                # 配置项（可选，适用于 JSON 驱动型渲染）
  types/                 # TS 类型定义（可选）
  index.vue              # 入口：仅组装，不写业务
```

## index.vue 编写规则

入口文件只做三件事：**导入 → 组装 → 透传数据**。

```vue
<template>
  <div class="dashboard">
    <DashboardHeader />
    <DashboardContent />
    <DashboardFooter />
  </div>
</template>

<script setup lang="ts">
import DashboardHeader from './components/dashboard-header.vue'
import DashboardContent from './components/dashboard-content.vue'
import DashboardFooter from './components/dashboard-footer.vue'
</script>
```

如果子组件间需要共享状态，在 `hooks/` 中编写 composable，由 `index.vue` 调用后通过 `props` 或 `provide` 下发。

## 必须拆分的场景

| 场景 | 说明 |
|------|------|
| 单文件超过 300 行 | 非绝对，但大多数情况都要遵循这个原则 |
| 存在独立业务职责 | 如头部搜索、侧边筛选各自独立 |
| 存在复用可能性 | 可能被其他页面或模块引用 |
| 存在复杂状态/副作用 | 如定时器、WebSocket、复杂表单校验等 |

## 数据通信方式

| 场景 | 方案 |
|------|------|
| 父子简单通信 | `props` / `emit` |
| 跨层级通信 | `provide` / `inject` |
| 页面级状态共享 | composable（`useXXX`） |
| 全局状态 | Pinia |

## 文件命名

- 组件文件：`kebab-case.vue`（如 `dashboard-header.vue`）
- composable：`use-xxx.ts`（如 `use-dashboard.ts`）
- 类型文件：放入 `types/` 目录，按功能命名
