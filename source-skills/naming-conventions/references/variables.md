# 变量命名

- 普通变量、参数、状态和自定义字段用 `camelCase`，名称体现上下文中的含义，如 `currentUser`、`order.totalAmount`。
- 布尔值用 `isLoading`、`hasPermission`、`canEdit`、`shouldRetry` 等谓词。集合名称体现元素，如 `selectedIds`，按键索引可用 `usersById`。
- 单位影响使用时写入名称，如 `elapsedMs`、`sizeBytes`。上下文足够明确时可用简短局部名，如 `users.map((user) => user.id)`。
- 外部字段保留协议名，内部绑定可取别名，如 `const { user_id: userId } = response`。
