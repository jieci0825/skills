# Composable

- 有复用价值或具有独立输入、状态和副作用边界的响应式逻辑可抽为 `useXxx`，只有一个调用方也可以。简单交互留在组件，纯计算、格式化和转换用普通工具函数。
- 默认在函数内创建实例状态。有意共享时明确所有者和范围，子树可用 Provide / Inject，应用内共享可沿用 Store。SSR 按请求隔离可变状态。
- 生命周期钩子默认在 `setup()` 或 `<script setup>` 的同步调用链注册。普通事件和定时器回调缺少组件上下文。`<script setup>` 的顶层 `await` 由编译器恢复上下文，异步 Composable 仍应在自身第一次 `await` 前注册所需钩子。
- 按需启动 DOM 监听、定时器和外部订阅，在卸载或对应作用域结束时清理。只返回调用方需要的 ref、派生值和操作。需控制写入时可返回只读状态及更新方法。

## Good（独立的窗口宽度）

每次调用创建独立状态，挂载后读取宽度并监听变化，卸载时移除监听，对外只读。

```ts
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

调用方在 setup 中写 `const { width } = useWindowWidth()`，用 `v-if="width !== null"` 判断是否显示宽度。普通点击回调中直接调用 `useWindowWidth()` 会导致生命周期钩子无法注册。若需点击后启动，可让 Composable 在 setup 注册清理钩子并返回 `start()`，点击时调用它。

## Bad（无意共享局部状态）

模块顶层的 `const count = ref(0)` 会让所有 `useCounter()` 调用共享同一个 ref，一个组件更新时其他组件也会读到新值。移进 `useCounter()` 即可按调用创建独立状态。

参考 [Vue Composables](https://vuejs.org/guide/reusability/composables.html)和 [SSR 的跨请求状态隔离](https://vuejs.org/guide/scaling-up/ssr.html#cross-request-state-pollution)。
