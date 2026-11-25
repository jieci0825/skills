# 类型命名

- TypeScript 类型别名和接口用 `PascalCase`，名称表达领域概念或使用角色，例如 `UserProfile`、`CreateOrderInput`、`CreateOrderResult`。接口沿用普通的领域命名，默认省略 `I` 前缀。
- 简单泛型中，参数角色清楚时可用 `T`。需要区分角色时用 `TInput`、`TResult`、`TKey` 等可读的名称。
- 类型名称和类型声明中的字段名分别判断。例如 `UserProfile` 使用 `PascalCase`，其内部自定义字段 `displayName` 使用 `camelCase`。描述外部接口时，字段保留协议名称。

```ts
interface UserProfile {
  displayName: string;
}

type Mapper<TInput, TResult> = (input: TInput) => TResult;
```
