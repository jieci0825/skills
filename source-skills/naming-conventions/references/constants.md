# 常量命名

为具备独立业务、配置或协议含义的固定值使用 `UPPER_SNAKE_CASE`。名称写明值的用途，时间和大小等容易误用的量注明单位，例如 `REQUEST_TIMEOUT_MS`、`MAX_UPLOAD_BYTES`。

`const` 约束绑定的重新赋值。用它声明的运行时数据、计算结果、可变对象或依赖实例，按各自的用途命名。判断时看这个值在代码中承担的角色，模块作用域、导出和字面量都只是线索。

```ts
const MAX_RETRY_COUNT = 3;
const REQUEST_TIMEOUT_MS = 5_000;

const retryCount = getRetryCount();
const requestClient = createRequestClient();
```
