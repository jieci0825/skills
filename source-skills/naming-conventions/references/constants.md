# 常量命名

有独立业务、配置或协议含义的固定值用 `UPPER_SNAKE_CASE`。名称说明用途，时间、大小等易误用的量写明单位，例如 `REQUEST_TIMEOUT_MS`、`MAX_UPLOAD_BYTES`。

`const` 限制绑定的重新赋值。用它声明的运行时数据、计算结果、可变对象和依赖实例仍按用途命名，例如 `retryCount`、`requestClient`。模块作用域、导出和字面量仅供判断。
