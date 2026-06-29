# Vue 组件命名 — 示例

## 通用组件（功能 + 类型）

**Good**

```
user-card.vue
user-avatar.vue
product-item.vue
order-table.vue
login-dialog.vue
```

**Bad**

```
UserCard.vue        ← PascalCase
card.vue            ← 缺少功能语义
userCard.vue        ← camelCase
```

## 页面组件（页面名称 + page）

**Good**

```
user-center-page.vue
order-detail-page.vue
```

**Bad**

```
UserCenterPage.vue  ← PascalCase
userCenter.vue      ← camelCase 且缺少 page 后缀
```
