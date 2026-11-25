# 变量命名

- 普通变量、参数、状态和项目自定义数据字段使用 `camelCase`，名称表达在当前代码中的含义，例如 `currentUser`、`selectedIds`、`order.totalAmount`。
- 布尔值读起来像一个判断，例如 `isLoading`、`hasPermission`、`canEdit`、`shouldRetry`。集合名称体现其中的元素，例如 `selectedIds`，按键索引的值可写成 `usersById`。
- 值的单位会影响使用时，在名称中注明，例如 `elapsedMs`、`sizeBytes`。局部名称的具体程度由上下文决定，例如 `users.map((user) => user.id)` 中的 `user` 已经清楚。
- 外部接口字段沿用协议名称。需要内部局部变量时，可以取别名，例如 `const { user_id: userId } = response`。
