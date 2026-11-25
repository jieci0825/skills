# SFC 与脚本

## 区块顺序

新增 SFC 按脚本、模板、样式的顺序排列，相邻区块留一个空行。按需添加各区块，例如纯静态组件可以只有 `<template>`。新组件默认用 `<script setup>`。需要保留具名导出或执行只在模块求值时运行的逻辑时，可以同时使用常规 `<script>`，两个脚本块都放在模板前。TypeScript 项目中的每个脚本块都使用 `lang="ts"`。

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

模板排在脚本前，区块紧贴，TypeScript 项目的脚本缺少 `lang="ts"`，并保留了空样式区块。

```vue
<template>
    <h2>{{ props.title }}</h2>
</template>
<script setup>
const props = defineProps({ title: String })
</script>
<style scoped></style>
```

## 脚本默认顺序

| 顺序 | 内容                                                     |
| ---- | -------------------------------------------------------- |
| 1    | Imports。静态导入                                        |
| 2    | Types。组件局部类型                                      |
| 3    | Component Options。按需声明 `defineOptions`              |
| 4    | Component Contracts。按需声明 Props、Emits、Model、Slots |
| 5    | Dependencies。路由、Store、Composable 等实例             |
| 6    | Constants。常量和静态配置                                |
| 7    | State。响应式源状态和模板引用                            |
| 8    | Computed。响应式派生值                                   |
| 9    | Functions。业务函数和事件处理                            |
| 10   | Watchers。`watch`、`watchEffect` 等监听                  |
| 11   | Lifecycle。生命周期钩子                                  |
| 12   | Expose。按需声明 `defineExpose`                          |

各组有内容时按需用空行分隔。调用 Composable 前先初始化它需要的本地常量或 `ref`。`watch()` 注册时会读取监听源的初值，启用 `immediate: true` 时还会立即执行回调。`watchEffect()` 默认也会立即执行。先初始化这些同步读取所依赖的绑定。

需要提升到模块作用域的宏参数使用编译器允许的字面量或模块级可用值。`defineExpose` 必须在 `<script setup>` 的第一个顶层 `await` 前调用。

### Good（按类别组织搜索框）

搜索框需要 Vue 3.3+ 和已配置的 Vue Router。路由查询参数 `q` 只用于初始化关键词，后续由输入框更新本地值，监听器在关键词变化时通知父组件。

```vue
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

interface Suggestion {
    id: string
    label: string
}

interface Props {
    suggestions: readonly Suggestion[]
    autofocus?: boolean
}

defineOptions({ name: 'SearchField' })

const props = defineProps<Props>()
const emit = defineEmits<{ search: [keyword: string] }>()

const route = useRoute()

const MAX_SUGGESTIONS = 5

const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const input = ref<HTMLInputElement | null>(null)

const visibleSuggestions = computed(() => {
    const query = keyword.value.trim()

    return props.suggestions.filter((suggestion) => suggestion.label.includes(query)).slice(0, MAX_SUGGESTIONS)
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
</script>

<template>
    <input
        ref="input"
        v-model="keyword"
        type="search"
        aria-label="搜索"
    />
    <ul>
        <li
            v-for="suggestion in visibleSuggestions"
            :key="suggestion.id"
        >
            {{ suggestion.label }}
        </li>
    </ul>
</template>
```

### Bad（监听先于依赖初始化）

立即执行的监听回调会读取尚未初始化的 `normalizedKeyword`。先声明派生值，再注册监听。

```ts
import { computed, ref, watch } from 'vue'

const keyword = ref('')

watch(keyword, () => console.info(normalizedKeyword.value), { immediate: true })

const normalizedKeyword = computed(() => keyword.value.trim())
```

### Good（复杂组件按功能组织）

下面是用户管理页的 `<script setup>` 片段。提交搜索时重置页码，分页读取排序后的列表，详情弹窗按选中 ID 从源列表查找用户。模板在 setup 完成后调用交互函数，分页控件传入整数页码。

```ts
import { computed, ref } from 'vue'

interface User {
    id: string
    name: string
}

const props = defineProps<{ users: readonly User[] }>()
const PAGE_SIZE = 20

// 搜索
const keyword = ref('')
const matchingUsers = computed(() => props.users.filter((user) => user.name.includes(keyword.value)))

function search(value: string) {
    keyword.value = value.trim()
    requestedPage.value = 1
}

// 表格
const sortByName = ref(false)
const orderedUsers = computed(() => {
    if (sortByName.value) {
        return [...matchingUsers.value].sort((a, b) => a.name.localeCompare(b.name))
    }

    return matchingUsers.value
})

function toggleNameSort() {
    sortByName.value = !sortByName.value
}

// 分页
const requestedPage = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(orderedUsers.value.length / PAGE_SIZE)))
const currentPage = computed(() => Math.min(requestedPage.value, pageCount.value))
const pageRows = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE

    return orderedUsers.value.slice(start, start + PAGE_SIZE)
})

function goToPage(page: number) {
    requestedPage.value = Math.min(Math.max(1, page), pageCount.value)
}

// 详情弹窗
const activeUserId = ref<string | null>(null)
const activeUser = computed(() => props.users.find((user) => user.id === activeUserId.value))

function openUserDetails(id: string) {
    activeUserId.value = id
}

function closeUserDetails() {
    activeUserId.value = null
}
```

## 派生状态

响应式输入可以唯一决定一个值时，优先从来源计算。用户可独立编辑、提交或取消的表单草稿，以及需要独立保存的快照，可各自拥有源状态。网络请求、状态写入和 DOM 操作由事件处理、监听或合适的生命周期承担。

### Good（从源状态计算）

```ts
import { computed, ref } from 'vue'

const unitPrice = ref(20)
const quantity = ref(2)

const subtotal = computed(() => unitPrice.value * quantity.value)
```

### Bad（维护一份同步副本）

小计的初始值和更新都重复计算同一公式，并在组件里多出一个可写入的状态来源。

```ts
import { ref, watch } from 'vue'

const unitPrice = ref(20)
const quantity = ref(2)
const subtotal = ref(unitPrice.value * quantity.value)

watch([unitPrice, quantity], () => {
    subtotal.value = unitPrice.value * quantity.value
})
```

### Good（排序时保留源数组）

```ts
import { computed, ref } from 'vue'

const scores = ref([80, 95, 70])

const rankedScores = computed(() => [...scores.value].sort((a, b) => b - a))
```

### Bad（在 getter 内原地排序）

```ts
import { computed, ref } from 'vue'

const scores = ref([80, 95, 70])

const rankedScores = computed(() => scores.value.sort((a, b) => b - a))
```

## 版本边界

- Vue 3.3+ 支持 `defineOptions`、`defineSlots` 及具名元组形式的 `defineEmits` 类型声明。较早版本可按需用常规 `<script>` 声明选项，用调用签名声明 Emits。
- Vue 3.4+ 支持 `defineModel`，旧版本使用显式模型 Prop 和对应的 `update:` 事件。
- Vue 3.5+ 默认让直接从 `defineProps()` 解构的绑定在同一个 `<script setup>` 内保持响应性。较早版本可保留 `props.foo` 访问或使用 `toRef(props, 'foo')`。使用类型声明的 Props 需要设置默认值时，较早版本可用 `withDefaults`。
- 向侦听器或 Composable 传递需要保持响应性的值时，按接收方的接口传 ref 或 getter。例如，监听 `props.foo` 可用 `watch(() => props.foo, callback)`。Vue 3.5+ 直接解构了 `foo` 时可用 `watch(() => foo, callback)`。
- `useTemplateRef` 自 Vue 3.5 起可用。较早版本可定义与模板中 `ref` 属性值同名的变量，例如 `const input = ref<HTMLInputElement | null>(null)` 对应 `ref="input"`。

参考 [Vue script setup API](https://vuejs.org/api/sfc-script-setup.html)、[侦听器](https://vuejs.org/guide/essentials/watchers.html)、[模板引用](https://vuejs.org/guide/essentials/template-refs.html) 和 [计算属性](https://vuejs.org/guide/essentials/computed.html#best-practices)。
