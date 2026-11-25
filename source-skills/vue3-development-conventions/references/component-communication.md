# 组件通信

先找出谁拥有状态、谁可以更新，以及哪些组件需要读取。让共同父组件、上下文提供者或 Store 按实际范围持有状态。Props 和 Emits 足够时，直接使用组件契约。事件总线适用于项目已有明确的广播语义及订阅清理机制的场景。

| 场景                   | 优先方式                      |
| ---------------------- | ----------------------------- |
| 父组件向子组件传递数据 | Props                         |
| 子组件向父组件通知事件 | Emits                         |
| 父子组件绑定受控值     | `v-model`                     |
| 父组件传入自定义视图   | Slots                         |
| 深层后代共享上下文     | Provide / Inject              |
| 兄弟组件协调           | 共同父组件管理                |
| 跨页面共享业务状态     | 项目已有的 Store              |
| 父组件命令式调用子组件 | Template Ref + `defineExpose` |

## 父传子（Props）

父组件通过 Props 传入数据。子组件按只读约定使用 Props，包括对象和数组的嵌套字段。需要独立编辑时，子组件可保留草稿，并通过提交事件让数据所有者决定是否更新。

```vue
<!-- label-badge.vue -->
<script setup lang="ts">
const props = defineProps<{ label: string }>()
</script>

<template>
    <span>{{ props.label }}</span>
</template>
```

```vue
<!-- profile-header.vue -->
<script setup lang="ts">
import LabelBadge from './label-badge.vue'

const displayName = 'Ada'
</script>

<template>
    <LabelBadge :label="displayName" />
</template>
```

## 子通知父（Emits）

子组件声明事件及其载荷，父组件在子组件标签上监听并决定如何处理。需要通知更上层组件时，可由中间组件显式转发事件。

```vue
<!-- item-picker.vue -->
<script setup lang="ts">
const props = defineProps<{ itemId: string }>()
const emit = defineEmits<{ (event: 'select', itemId: string): void }>()
</script>

<template>
    <button
        type="button"
        @click="emit('select', props.itemId)"
    >
        选择
    </button>
</template>
```

```vue
<!-- picker-page.vue -->
<script setup lang="ts">
import { ref } from 'vue'

import ItemPicker from './item-picker.vue'

const selectedId = ref<string | null>(null)

function selectItem(itemId: string) {
    selectedId.value = itemId
}
</script>

<template>
    <ItemPicker
        item-id="a1"
        @select="selectItem"
    />
    <p v-if="selectedId">已选 {{ selectedId }}</p>
</template>
```

## 受控值（v-model）

父组件初始化受控值。Vue 3.4+ 的子组件可用 `defineModel` 声明绑定。需要区分绑定含义时可使用具名模型，例如父组件的 `v-model:visible` 对应子组件的 `defineModel('visible')`。父组件传入 `undefined` 且子组件设置了模型默认值时，双方初始值可能不同。

```vue
<!-- editor-page.vue -->
<script setup lang="ts">
import { ref } from 'vue'

import SearchInput from './search-input.vue'

const keyword = ref('')
</script>

<template>
    <SearchInput v-model="keyword" />
</template>
```

```vue
<!-- search-input.vue，Vue 3.4+ -->
<script setup lang="ts">
const model = defineModel<string>({ required: true })
</script>

<template>
    <input
        v-model="model"
        type="search"
        aria-label="搜索"
    />
</template>
```

Vue 3.4 之前，父组件用法相同。子组件显式定义 `modelValue` 与 `update:modelValue`，通过可写 `computed` 将它们接入原生输入框的 `v-model`。

```vue
<!-- search-input.vue，旧版本替代实现 -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

const model = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
})
</script>

<template>
    <input
        v-model="model"
        type="search"
        aria-label="搜索"
    />
</template>
```

## 自定义视图（Slots）

子组件定义渲染位置和传给插槽的数据，父组件提供视图内容。示例的 `footer` 可以省略，省略时由子组件渲染默认内容。Vue 3.3+ 可用 `defineSlots` 声明插槽类型，较早版本可保留相同的模板。

```vue
<!-- summary-card.vue -->
<script setup lang="ts">
const props = defineProps<{ total: number }>()
defineSlots<{ footer?: (props: { total: number }) => unknown }>()
</script>

<template>
    <section>
        <slot
            name="footer"
            :total="props.total"
        >
            共 {{ props.total }} 项
        </slot>
    </section>
</template>
```

```vue
<!-- summary-page.vue -->
<script setup lang="ts">
import SummaryCard from './summary-card.vue'
</script>

<template>
    <SummaryCard :total="3">
        <template #footer="{ total }">
            <strong>已选 {{ total }} 项</strong>
        </template>
    </SummaryCard>
</template>
```

## 子树上下文（Provide / Inject）

提供者持有状态，后代通过同一个注入键读取数据、调用更新操作。TypeScript 项目可用 `InjectionKey` 为 Symbol 键关联上下文类型。这里的计数上下文是必需依赖，消费方在缺少提供者时直接报错。

```ts
// counter-context.ts
import type { InjectionKey, Ref } from 'vue'

interface CounterContext {
    count: Readonly<Ref<number>>
    increment: () => void
}

export const COUNTER_KEY: InjectionKey<CounterContext> = Symbol('counter')
```

```vue
<!-- counter-provider.vue -->
<script setup lang="ts">
import { provide, readonly, ref } from 'vue'

import { COUNTER_KEY } from './counter-context'

const count = ref(0)

function increment() {
    count.value++
}

provide(COUNTER_KEY, { count: readonly(count), increment })
</script>

<template>
    <slot />
</template>
```

```vue
<!-- counter-button.vue -->
<script setup lang="ts">
import { inject } from 'vue'

import { COUNTER_KEY } from './counter-context'

const counter = inject(COUNTER_KEY)

if (!counter) {
    throw new Error('CounterButton 需要在 CounterProvider 下渲染')
}

const { count, increment } = counter
</script>

<template>
    <button
        type="button"
        @click="increment"
    >
        {{ count }}
    </button>
</template>
```

将 `CounterButton` 渲染在 `CounterProvider` 的插槽内，就能读取该提供者的计数状态。

```vue
<!-- counter-panel.vue -->
<script setup lang="ts">
import CounterButton from './counter-button.vue'
import CounterProvider from './counter-provider.vue'
</script>

<template>
    <CounterProvider>
        <CounterButton />
    </CounterProvider>
</template>
```

## 兄弟组件（共同父组件管理）

搜索框保留尚未提交的输入，提交时通知父组件。父组件持有已应用的关键词，并将它下发给结果组件。

```vue
<!-- filter-toolbar.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ (event: 'search', value: string): void }>()

const draft = ref('')

function search() {
    emit('search', draft.value.trim())
}
</script>

<template>
    <form @submit.prevent="search">
        <input
            v-model="draft"
            type="search"
            aria-label="筛选"
        />
        <button type="submit">搜索</button>
    </form>
</template>
```

```vue
<!-- result-list.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Item {
    id: string
    label: string
}

const props = defineProps<{
    keyword: string
    items: readonly Item[]
}>()

const visibleItems = computed(() => props.items.filter((item) => item.label.includes(props.keyword)))
</script>

<template>
    <ul>
        <li
            v-for="item in visibleItems"
            :key="item.id"
        >
            {{ item.label }}
        </li>
    </ul>
</template>
```

```vue
<!-- filter-page.vue -->
<script setup lang="ts">
import { ref } from 'vue'

import FilterToolbar from './filter-toolbar.vue'
import ResultList from './result-list.vue'

const items = [
    { id: 'vue', label: 'Vue' },
    { id: 'pinia', label: 'Pinia' },
    { id: 'vite', label: 'Vite' },
]
const keyword = ref('')

function updateKeyword(value: string) {
    keyword.value = value
}
</script>

<template>
    <FilterToolbar @search="updateKeyword" />
    <ResultList
        :keyword="keyword"
        :items="items"
    />
</template>
```

## 跨页面状态（Store）

示例假设应用已经配置 Pinia。商品页通过 Store 的操作添加商品，购物车页从同一 Store 读取商品总数。需要随链接分享或通过浏览器前进、后退恢复的筛选条件，优先考虑 URL 查询参数。

```ts
// cart-store.ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', () => {
    const productIds = ref<string[]>([])
    const itemCount = computed(() => productIds.value.length)

    function addProduct(productId: string) {
        productIds.value.push(productId)
    }

    return { productIds, itemCount, addProduct }
})
```

```vue
<!-- product-page.vue -->
<script setup lang="ts">
import { useCartStore } from './cart-store'

const cart = useCartStore()
</script>

<template>
    <button
        type="button"
        @click="cart.addProduct('p1')"
    >
        加入购物车
    </button>
</template>
```

```vue
<!-- cart-page.vue -->
<script setup lang="ts">
import { useCartStore } from './cart-store'

const cart = useCartStore()
</script>

<template>
    <p>购物车有 {{ cart.itemCount }} 件商品</p>
</template>
```

## 命令式调用（Template Ref + defineExpose）

聚焦等命令式交互可通过子组件的公开方法实现。只暴露调用方需要的接口，并处理组件挂载前或被条件卸载后的空引用。

```vue
<!-- name-field.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const input = ref<HTMLInputElement | null>(null)

function focus() {
    input.value?.focus()
}

defineExpose({ focus })
</script>

<template>
    <input
        ref="input"
        aria-label="姓名"
    />
</template>
```

```vue
<!-- name-form.vue -->
<script setup lang="ts">
import { ref } from 'vue'

import NameField from './name-field.vue'

const nameField = ref<InstanceType<typeof NameField> | null>(null)

function focusName() {
    nameField.value?.focus()
}
</script>

<template>
    <NameField ref="nameField" />
    <button
        type="button"
        @click="focusName"
    >
        聚焦姓名输入框
    </button>
</template>
```

参考 Vue 文档 [Props](https://vuejs.org/guide/components/props.html)、[组件事件](https://vuejs.org/guide/components/events.html)、[组件 v-model](https://vuejs.org/guide/components/v-model.html)、[插槽](https://vuejs.org/guide/components/slots.html)、[依赖注入](https://vuejs.org/guide/components/provide-inject.html)、[状态管理](https://vuejs.org/guide/scaling-up/state-management.html) 和 [模板引用](https://vuejs.org/guide/essentials/template-refs.html)。
