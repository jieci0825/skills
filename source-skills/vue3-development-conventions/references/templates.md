# 模板表达式与属性顺序

## 表达式

简单属性访问、布尔判断和轻量纯格式化可内联。多步过滤、排序、映射及需要业务名称解释的条件优先放在脚本里。命名的响应式派生值可用 `computed`，需要当前行等参数的计算可用纯函数。渲染表达式只读取和计算值。事件可直接调用处理函数或发送组件事件，多步更新交给脚本中的处理函数。

### Good

在脚本中筛选并排序商品。模板只判断加载和空列表，显示名称和格式化后的价格。以下为同一 SFC 的片段。

```ts
const availableProducts = computed(() =>
    props.products.filter((product) => product.available).sort((a, b) => a.price - b.price),
)

function formatPrice(price: number) {
    return currencyFormatter.format(price)
}
```

```vue
<ul v-if="!props.isLoading && availableProducts.length > 0">
    <li
        v-for="product in availableProducts"
        :key="product.id"
    >
        {{ product.name }} · {{ formatPrice(product.price) }}
    </li>
</ul>
```

### Bad

在 `v-if` 中用 `props.products.some((product) => product.available)` 判断可用项，又在 `v-for` 中串联 `.filter().sort().map()`，重复筛选并组装显示数据。

## 属性顺序

1. **结构性指令**包括 `v-for`、`v-if`、`v-else-if`、`v-else`、`v-show`、`v-slot`、动态组件 `<component>` 上的 `:is`。
2. **标识及引用**包括 `:key`、`ref`、`id`。
3. **双向绑定**包括 `v-model`、`v-model:visible`。
4. **组件属性**包括普通 Props 和 HTML 属性，如 `:disabled`、`aria-label`。
5. **样式属性**包括 `class`、`:class`、`style`、`:style`。
6. **事件监听**如 `@submit`、`@cancel`。

同组按项目习惯或语义排列，未列出的指令沿用项目约定。同一节点上的 `v-if` 先于 `v-for` 求值，读不到循环变量。按条目筛选时先派生列表或拆分模板层级。

```vue
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
```

对象式 `v-bind` 与显式普通属性重名时，后写的绑定生效。下例的 `:label` 覆盖 `defaultFieldProps` 中的同名值。重排前也要核对样式属性、对象式 `v-on` 和 `v-bind` 中监听器的合并行为。

```vue
<TextField
    v-bind="defaultFieldProps"
    :label="label"
/>
```

参考 [Vue 3 对象式 v-bind 的合并行为](https://v3-migration.vuejs.org/breaking-changes/v-bind.html)和[属性顺序](https://eslint.vuejs.org/rules/attributes-order.html)。
