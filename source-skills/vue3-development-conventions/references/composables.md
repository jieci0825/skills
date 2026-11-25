# Composable

## 何时抽取

- 一段响应式逻辑有复用价值，或在复杂组件内有自己的输入、状态和副作用边界时，可抽成 `useXxx`。只有一个调用方的逻辑也可以抽取。简单的本地交互留在组件，纯计算、格式化和转换用普通工具函数。
- 实例状态默认在函数内创建。有意共享时，先明确状态的所有者和使用范围。组件子树可用 Provide / Inject，应用内共享状态可沿用项目的 Store。SSR 中按请求隔离可变状态。
- 组件生命周期钩子默认在 `setup()` 或 `<script setup>` 的同步调用链中注册。普通事件和定时器回调没有注册这些钩子所需的组件上下文。`<script setup>` 的顶层 `await` 由编译器恢复组件上下文。异步 Composable 应在自身第一次 `await` 前注册所需的组件生命周期钩子。
- DOM 事件监听、定时器和外部订阅在需要时启动，并在组件卸载或对应作用域结束时清理。只返回调用方需要的 ref、派生值和操作。需要由 Composable 管理写入时，可返回只读状态和更新方法。

## Good（独立的响应式窗口宽度）

每次调用都会创建自己的 `width`。组件挂载后读取 `window.innerWidth` 并开始监听窗口大小变化，卸载时移除监听。调用方只读取宽度。

```ts
// use-window-width.ts
import { onMounted, onUnmounted, readonly, ref } from 'vue'

export function useWindowWidth() {
    const width = ref<number | null>(null)

    function updateWidth() {
        width.value = window.innerWidth
    }

    onMounted(() => {
        updateWidth()
        window.addEventListener('resize', updateWidth)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', updateWidth)
    })

    return { width: readonly(width) }
}
```

```vue
<!-- width-label.vue -->
<script setup lang="ts">
import { useWindowWidth } from './use-window-width'

const { width } = useWindowWidth()
</script>

<template>
    <span v-if="width !== null">{{ width }} px</span>
</template>
```

直接在普通的 `@click` 回调中调用 `useWindowWidth()`，其中的生命周期钩子将无法注册。这个示例在挂载后自动开始监听。如果需要点击后才开始监听，可实现一个返回 `start()` 的版本，在 setup 阶段注册清理钩子，点击时调用 `start()`。

## Bad（在模块级共享本应局部的状态）

`count` 定义在模块顶层，因此每次调用 `useCounter()` 都会共享同一个 ref。一个组件调用 `increment()` 后，另一个组件读到的计数也会变化。把 `const count = ref(0)` 移到 `useCounter()` 内部，每次调用就会创建自己的计数状态。

```ts
import { ref } from 'vue'

const count = ref(0)

export function useCounter() {
    function increment() {
        count.value++
    }

    return { count, increment }
}
```

参考 [Vue Composables](https://vuejs.org/guide/reusability/composables.html) 和 [SSR 的跨请求状态隔离](https://vuejs.org/guide/scaling-up/ssr.html#cross-request-state-pollution)。
