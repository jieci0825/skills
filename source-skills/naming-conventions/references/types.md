# 类型命名

- TypeScript 类型别名和接口用 `PascalCase`，名称表达领域概念或角色，如 `UserProfile`、`CreateOrderInput`、`CreateOrderResult`。接口默认省略 `I` 前缀。
- 简单泛型在角色清楚时可用 `T`。需要区分角色时用 `TInput`、`TResult`、`TKey` 等。
- 字段单独判断。自定义字段用 `camelCase`，如 `UserProfile` 内的 `displayName`。描述外部接口时保留协议字段名。
