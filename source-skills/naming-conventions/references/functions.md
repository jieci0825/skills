# 函数命名

- 普通函数、方法及函数表达式或箭头函数的绑定用 `camelCase`，以动词和对象说明行为，如 `fetchUser`、`formatDate`。
- 布尔返回值用语义匹配的谓词，如 `isValidEmail`、`hasPermission`、`canEditOrder`、`shouldRetry`。
- 内部事件处理函数可用 `handleSubmit`，传入的事件回调可用 `onSubmit`。已有框架或接口约定时沿用其名称。
- 组件与 Hook 按框架命名，如 `PascalCase` 的 `UserProfile`、`use` 开头的 `useUserProfile`。组件文件名按路径规则判断。
