# 模板表达式与属性顺序

## 表达式

简单属性访问、布尔判断和轻量的纯格式化调用可以直接写在模板里。多步过滤、排序、映射和需要用业务名称解释的条件，优先在脚本中定义。命名的响应式派生值可用 `computed`，需要接收当前行等参数的计算可用纯函数。渲染表达式只读取和计算值。事件绑定可以直接调用处理函数或发送组件事件，多步更新逻辑放在脚本里的处理函数中。

### Good

脚本先筛选可用商品并按价格排序。模板只判断加载是否结束、列表是否为空，并逐项显示商品名称和格式化后的价格。

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Product {
    id: string
    name: string
    price: number
    available: boolean
}

const props = defineProps<{
    products: readonly Product[]
    isLoading: boolean
}>()

const currencyFormatter = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' })

const availableProducts = computed(() =>
    props.products.filter((product) => product.available).sort((a, b) => a.price - b.price),
)

function formatPrice(price: number) {
    return currencyFormatter.format(price)
}
</script>

<template>
    <ul v-if="!props.isLoading && availableProducts.length > 0">
        <li
            v-for="product in availableProducts"
            :key="product.id"
        >
            {{ product.name }} · {{ formatPrice(product.price) }}
        </li>
    </ul>
</template>
```

### Bad

同一份商品数据先在 `v-if` 中判断是否存在可用项，接着在 `v-for` 里再次筛选、排序并组装显示数据。下面的模板片段复用 Good 示例中的 `props` 和 `formatPrice`。

```vue
<template>
    <ul v-if="!props.isLoading && props.products.some((product) => product.available)">
        <li
            v-for="product in props.products
                .filter((item) => item.available)
                .sort((a, b) => a.price - b.price)
                .map((item) => ({ id: item.id, label: item.name + ' · ' + formatPrice(item.price) }))"
            :key="product.id"
        >
            {{ product.label }}
        </li>
    </ul>
</template>
```

## 属性顺序

| 顺序 | 分类       | 示例                                                                                          |
| ---- | ---------- | --------------------------------------------------------------------------------------------- |
| 1    | 结构性指令 | `v-for`、`v-if`、`v-else-if`、`v-else`、`v-show`、`v-slot`、动态组件 `<component>` 上的 `:is` |
| 2    | 标识及引用 | `:key`、`ref`、`id`                                                                           |
| 3    | 双向绑定   | `v-model`、`v-model:visible`                                                                  |
| 4    | 组件属性   | 普通 Props 和 HTML 属性，例如 `:disabled`、`aria-label`                                       |
| 5    | 样式属性   | `class`、`:class`、`style`、`:style`                                                          |
| 6    | 事件监听   | `@submit`、`@cancel`                                                                          |

同组按项目习惯或语义排列，未列出的指令遵循项目已有约定。同一节点上的 `v-if` 先于 `v-for` 求值，缺少循环变量的作用域。需要按条目筛选时，先派生列表或拆分模板层级。

### 示例

`ProfileEditor` 片段展示六组属性在同一组件标签中的排布。

```vue
<template>
    <ProfileEditor
        v-if="showEditor"
        ref="editor"
        id="profile-editor"
        v-model="draft"
        :disabled="isSaving"
        :error-message="errorMessage"
        class="profile-editor"
        :class="{ 'is-saving': isSaving }"
        @submit="saveProfile"
        @cancel="closeEditor"
    />
</template>
```

对象式 `v-bind` 与显式普通属性重名时，后写的绑定生效。`TextField` 片段中的 `:label` 会覆盖 `defaultFieldProps` 中的同名值。重排前还需核对样式属性、对象式 `v-on` 和 `v-bind` 中监听器的合并行为。

```vue
<template>
    <TextField
        v-bind="defaultFieldProps"
        :label="label"
    />
</template>
```

参考 [Vue 3 对象式 v-bind 的合并行为](https://v3-migration.vuejs.org/breaking-changes/v-bind.html) 和 [eslint-plugin-vue 的属性顺序](https://eslint.vuejs.org/rules/attributes-order.html)。
