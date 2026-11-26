# Vue 样式机制

组件局部样式默认用 `<style scoped>`，已有 CSS Modules 等隔离方案时沿用。全局样式集中在约定的入口或主题文件。本规范只约定 Vue 的隔离和穿透机制，CSS、SCSS、Less、Tailwind CSS 等技术沿用项目方案。

定制子组件时，优先用公开的样式属性、CSS 变量或主题。若 `UiField` 公开了提示色变量，可在包裹它的 `.profile-form` 局部容器中设置。

```css
/* <style scoped> */
.profile-form {
    --ui-field-hint-color: var(--text-muted);
}
```

如果当前版本缺少公开样式入口，且提示节点为 `.ui-field__hint`，可从局部容器出发，指定目标选择器。

```css
/* <style scoped> */
.profile-form :deep(.ui-field__hint) {
    color: var(--text-muted);
}
```

两例均使用主题的 `--text-muted`。穿透规则匹配该容器下所有 `.ui-field__hint` 后代，单独写 `:deep(.ui-field__hint)` 会失去容器约束，扩大影响范围。

参考 [Vue SFC CSS 特性](https://vuejs.org/api/sfc-css-features.html)。
