---
name: file-naming
description: 规范项目中的文件命名方式，确保文件名统一使用短横线连接（kebab-case），提高代码一致性与可读性。在创建、重命名、生成任何文件时自动应用。
---

# 文件命名规范

## 核心规则

所有文件名必须使用 **kebab-case**（小写字母 + 短横线连接）：

1. 使用 **小写字母**，单词之间用 **`-`** 连接
2. 禁止 camelCase、PascalCase、snake_case 及空格

适用于所有文件类型（`.vue`、`.ts`、`.js`、`.tsx`、`.jsx`、`.scss`、`.json`、`.md` 等）。

示例见 [naming-examples.md](references/naming-examples.md)

---

## Vue 组件命名约定

采用 **语义化 kebab-case**，结构为 `功能 + 类型`。

示例见 [vue-component-naming.md](references/vue-component-naming.md)

---

## 命名转换规则

当用户提供非 kebab-case 名称时，自动转换：

- `camelCase` → kebab-case（`userProfile` → `user-profile`）
- `PascalCase` → kebab-case（`UserProfile` → `user-profile`）
- `snake_case` → kebab-case（`user_profile` → `user-profile`）
