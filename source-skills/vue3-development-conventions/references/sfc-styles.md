# Vue 样式机制

- 组件局部样式默认使用 `<style scoped>`，已有 CSS Modules 等隔离方案的项目沿用对应方案。全局样式在项目约定的入口或主题文件集中管理。
- 定制子组件时，优先使用它公开的样式属性、CSS 变量或主题机制。确需用 `:deep()` 匹配内部节点时，以当前组件的局部容器为起点，使用具体的目标选择器。
- 沿用已有的 CSS、SCSS、Less 或 Tailwind CSS 等技术。这里只规定 Vue 的隔离与穿透机制。

## 优先使用组件公开的 CSS 变量

示例假设项目已注册 `UiField`，并在主题中定义了 `--text-muted`。`UiField` 使用公开的 CSS 变量 `--ui-field-hint-color` 设置提示文字颜色。

```vue
<template>
    <div class="profile-form">
        <UiField />
    </div>
</template>

<style scoped>
.profile-form {
    --ui-field-hint-color: var(--text-muted);
}
</style>
```

## 需要穿透时限制范围

如果项目所用版本的 `UiField` 缺少提示文字的公开样式入口，且提示节点使用 `.ui-field__hint`，可以使用下面的选择器。该片段沿用 `.profile-form` 容器和主题中的 `--text-muted`，会匹配当前组件该容器下的所有 `.ui-field__hint` 后代。

```vue
<style scoped>
.profile-form :deep(.ui-field__hint) {
    color: var(--text-muted);
}
</style>
```

单独写 `:deep(.ui-field__hint)` 缺少明确的局部容器约束，影响范围随当前组件内部结构扩大。

参考 [Vue SFC CSS 特性](https://vuejs.org/api/sfc-css-features.html)。
