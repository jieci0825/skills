# SFC 与脚本

## 区块顺序

新 SFC 按脚本 → 模板 → 样式排列，区块间空一行，按需添加。纯静态组件可只有 `<template>`。新组件默认用 `<script setup>`，需保留具名导出或仅在模块求值时执行的逻辑时，可另加常规 `<script>`，两个脚本块都放在模板前。TS 项目的每个脚本块都用 `lang="ts"`。

### Good

```vue
<script setup lang="ts">
const props = defineProps<{ title: string }>()
</script>

<template>
    <h2 class="section-title">{{ props.title }}</h2>
</template>

<style scoped>
.section-title {
    margin-block: 0;
}
</style>
```

### Bad

模板先于脚本、区块紧贴、TS 脚本缺少 `lang="ts"` 或保留空样式区块。

## 脚本默认顺序

静态导入 → 局部类型 → 组件选项（`defineOptions`） → 组件契约（Props、Emits、Model、Slots） → 依赖实例（路由、Store、Composable） → 常量和静态配置 → 响应式源状态和模板引用 → 派生值 → 业务函数和事件处理 → 监听 → 生命周期 → `defineExpose`。非空组按需用空行分隔。

- Composable 调用前初始化它依赖的本地常量和 ref。`watch` 注册时读取源的初值，`immediate: true` 还会立即执行回调。`watchEffect` 默认立即执行。提前初始化同步读取的绑定。
- 需提升到模块作用域的宏参数使用编译器允许的字面量或模块级值。`defineExpose` 必须先于 `<script setup>` 中第一个顶层 `await`。

### Good（按类别组织）

搜索框的脚本片段需要 Vue 3.3+ 和已配置的 Vue Router。路由查询参数 `q` 只初始化关键词，输入框通过 `v-model="keyword"` 更新本地值，监听器在关键词变化时通知父组件。

```ts
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

interface Suggestion {
    id: string
    label: string
}

defineOptions({ name: 'SearchField' })

const props = defineProps<{ suggestions: readonly Suggestion[]; autofocus?: boolean }>()
const emit = defineEmits<{ search: [keyword: string] }>()

const route = useRoute()

const MAX_SUGGESTIONS = 5

const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const input = ref<HTMLInputElement | null>(null) // 模板通过 ref="input" 绑定

const visibleSuggestions = computed(() => {
    const query = keyword.value.trim()
    return props.suggestions.filter((item) => item.label.includes(query)).slice(0, MAX_SUGGESTIONS)
})

function focus() {
    input.value?.focus()
}

watch(keyword, (value) => emit('search', value.trim()))

onMounted(() => {
    if (props.autofocus) {
        focus()
    }
})

defineExpose({ focus })
```

### Bad（监听先于依赖初始化）

这里的回调立即读取尚未初始化的 `normalizedKeyword`。先声明派生值，再注册监听。

```ts
const keyword = ref('')

watch(keyword, () => console.info(normalizedKeyword.value), { immediate: true })

const normalizedKeyword = computed(() => keyword.value.trim())
```

### Good（按功能组织）

复杂用户管理页可把各功能的状态、派生值和操作放在一起。

- **搜索**集中放 `keyword`、`matchingUsers` 和 `search()`，提交搜索时重置页码。
- **表格**集中放 `sortByName`、`orderedUsers` 和 `toggleNameSort()`，按需复制并排序筛选结果。
- **分页**集中放 `requestedPage`、`pageCount`、`currentPage`、`pageRows` 和 `goToPage()`，从排序后列表取当前页，将传入的整数页码限制在有效范围。
- **详情弹窗**集中放 `activeUserId`、`activeUser` 和打开、关闭函数，用选中 ID 从源列表找用户。

模板在 setup 完成后才调用 `search()` 等交互函数，因此它们可以访问后面声明的状态。节选如下。

```ts
// 搜索
const keyword = ref('')
const matchingUsers = computed(() => props.users.filter((user) => user.name.includes(keyword.value)))

function search(value: string) {
    keyword.value = value.trim()
    requestedPage.value = 1
}

// 表格分组在此处用 matchingUsers 得到 orderedUsers。

// 分页
const requestedPage = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(orderedUsers.value.length / PAGE_SIZE)))
const currentPage = computed(() => Math.min(requestedPage.value, pageCount.value))
```

## 派生状态

响应式输入能唯一决定的值优先从源状态计算。独立编辑、提交或取消的表单草稿，以及需要独立保存的快照，可拥有自己的源状态。网络请求、状态写入和 DOM 操作放在事件处理、监听或合适的生命周期中。

- **Good** 用 `computed(() => unitPrice.value * quantity.value)` 得到小计。**Bad** 创建可写的小计 ref，再用 `watch` 重复公式来同步。
- **Good** 在 getter 中用 `[...scores.value].sort((a, b) => b - a)` 保留源数组。**Bad** 用 `scores.value.sort((a, b) => b - a)` 原地修改源。

## 版本边界

- Vue 3.3+ 支持 `defineOptions`、`defineSlots` 和 `defineEmits` 具名元组。旧版本可用常规 `<script>` 声明选项，用调用签名声明 Emits。
- Vue 3.4+ 支持 `defineModel`，旧版本用显式模型 Prop 和对应的 `update:` 事件。
- Vue 3.5+ 中，直接从 `defineProps()` 解构的绑定默认在同一 `<script setup>` 中保持响应性。旧版本可用 `props.foo` 或 `toRef(props, 'foo')`，类型声明的 Props 需要默认值时可用 `withDefaults`。
- 向监听器或 Composable 传入响应值时，按接收方接口传 ref 或 getter，如 `watch(() => props.foo, callback)`。Vue 3.5+ 直接解构时可用 `watch(() => foo, callback)`。
- Vue 3.5+ 可用 `useTemplateRef`。旧版本可用与模板引用同名的变量，如 `const input = ref<HTMLInputElement | null>(null)` 对应 `ref="input"`。

参考 [Vue script setup API](https://vuejs.org/api/sfc-script-setup.html)、[侦听器](https://vuejs.org/guide/essentials/watchers.html)、[模板引用](https://vuejs.org/guide/essentials/template-refs.html)和[计算属性](https://vuejs.org/guide/essentials/computed.html#best-practices)。
