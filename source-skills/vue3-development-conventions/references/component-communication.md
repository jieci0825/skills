# 组件通信

先明确状态的所有者、更新者和读取范围，再由共同父组件、上下文提供者或 Store 按范围持有。Props 和 Emits 足够时直接用组件契约。事件总线适用于项目已有明确广播语义和订阅清理机制的场景。

以下示例只展示通信相关片段。

## 父传子（Props）

父组件用 `<LabelBadge :label="displayName" />` 传值，子组件通过 `defineProps<{ label: string }>()` 声明并读取。Props 及对象、数组的嵌套字段均按只读约定使用。需独立编辑时，子组件可保留草稿，提交时用事件请所有者决定是否更新。

## 子通知父（Emits）

子组件声明事件及载荷，在按钮的 `@click` 中发送 `select`。父组件在子组件标签监听，例如 `<ItemPicker item-id="a1" @select="selectItem" />`，由 `selectItem` 决定如何更新选中值。通知更上层时，可由中间组件显式转发。

```ts
const props = defineProps<{ itemId: string }>()
const emit = defineEmits<{ (event: 'select', itemId: string): void }>()

function select() {
    emit('select', props.itemId)
}
```

## 受控值（v-model）

父组件初始化值，如 setup 中的 `const keyword = ref('')`，再用 `<SearchInput v-model="keyword" />` 绑定。Vue 3.4+ 的子组件可用 `const model = defineModel<string>({ required: true })`，并在原生输入框上用 `v-model="model"`。具名绑定如父组件的 `v-model:visible` 对应子组件的 `defineModel('visible')`。父组件传入 `undefined` 且子组件设置模型默认值时，双方初始值可能不同。

Vue 3.4 之前，父组件用法不变，子组件用显式 Prop、事件和可写 `computed` 接入输入框的 `v-model="model"`。

```ts
import { computed } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

const model = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
})
```

## 自定义视图（Slots）

子组件决定渲染位置及插槽数据，父组件提供视图。`footer` 可省略，由子组件渲染默认内容。Vue 3.3+ 可用 `defineSlots<{ footer?: (props: { total: number }) => unknown }>()` 声明类型，旧版本模板相同。

```vue
<!-- 子组件模板 -->
<slot
    name="footer"
    :total="props.total"
>
    共 {{ props.total }} 项
</slot>
```

```vue
<!-- 父组件模板 -->
<SummaryCard :total="3">
    <template #footer="{ total }">
        <strong>已选 {{ total }} 项</strong>
    </template>
</SummaryCard>
```

## 子树上下文（Provide / Inject）

提供者持有状态，后代通过同一个键读取并调用更新方法。TS 可用 `InjectionKey` 给 Symbol 键关联类型。以下计数上下文是必需依赖，消费方缺少提供者时直接报错。

```ts
// counter-context.ts
import type { InjectionKey, Ref } from 'vue'

interface CounterContext {
    count: Readonly<Ref<number>>
    increment: () => void
}

export const COUNTER_KEY: InjectionKey<CounterContext> = Symbol('counter')
```

```ts
// counter-provider.vue 的 setup
const count = ref(0)

function increment() {
    count.value++
}

provide(COUNTER_KEY, { count: readonly(count), increment })
```

```ts
// counter-button.vue 的 setup
const counter = inject(COUNTER_KEY)

if (!counter) {
    throw new Error('CounterButton 需要在 CounterProvider 下渲染')
}

const { count, increment } = counter
```

在提供者的默认插槽内渲染 `<CounterProvider><CounterButton /></CounterProvider>`，按钮即可显示该计数并调用 `increment`。

## 兄弟组件（共同父组件管理）

搜索框保留未提交的草稿，提交时发送修剪后的关键词。共同父组件持有已应用的 `keyword`，接到 `search` 后更新，再作为 Props 下发给结果组件。结果组件用它派生筛选后的列表。

```vue
<FilterToolbar @search="updateKeyword" />
<ResultList
    :keyword="keyword"
    :items="items"
/>
```

## 跨页面状态（Store）

沿用项目的 Store。以已配置 Pinia 的应用为例，商品页和购物车页分别调用 `const cart = useCartStore()`，商品页用 `cart.addProduct('p1')` 写入，购物车页读 `cart.itemCount`。

```ts
export const useCartStore = defineStore('cart', () => {
    const productIds = ref<string[]>([])
    const itemCount = computed(() => productIds.value.length)

    function addProduct(productId: string) {
        productIds.value.push(productId)
    }

    return { productIds, itemCount, addProduct }
})
```

需要通过链接分享或靠浏览器前进、后退恢复的筛选条件，优先考虑 URL 查询参数。

## 命令式调用（Template Ref + defineExpose）

聚焦等命令式交互可用子组件的公开方法。仅暴露调用方需要的接口，处理挂载前或条件卸载后的空引用。

```ts
// name-field.vue 的 setup，输入框使用 ref="input"
const input = ref<HTMLInputElement | null>(null)

function focus() {
    input.value?.focus()
}

defineExpose({ focus })
```

```ts
// name-form.vue 的 setup，子组件使用 <NameField ref="nameField" />
const nameField = ref<InstanceType<typeof NameField> | null>(null)

function focusName() {
    nameField.value?.focus()
}
```

参考 Vue 文档 [Props](https://vuejs.org/guide/components/props.html)、[组件事件](https://vuejs.org/guide/components/events.html)、[组件 v-model](https://vuejs.org/guide/components/v-model.html)、[插槽](https://vuejs.org/guide/components/slots.html)、[依赖注入](https://vuejs.org/guide/components/provide-inject.html)、[状态管理](https://vuejs.org/guide/scaling-up/state-management.html)和[模板引用](https://vuejs.org/guide/essentials/template-refs.html)。
