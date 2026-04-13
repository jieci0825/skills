# 桶导出 — 示例

**命名空间聚合（适用于 API 模块、业务模块）**

```ts
// api/index.ts
export * as authApi from './modules/auth'
export * as deviceApi from './modules/device'
```

**选择性再导出（适用于 utils、middlewares 等）**

```ts
// utils/index.ts
export { executeCommand, cancelExecutingCommand } from './execute-command'
export { requestUtils } from './request-utils'
```

**完整再导出（适用于无命名冲突的子模块聚合）**

```ts
// stores/index.ts
export * from './user'
export * from './app'
```

**Bad — 目录有多个子模块却无统一入口**

```ts
// 消费方不得不深入子路径
import { executeCommand } from '@/utils/execute-command'
import { requestUtils } from '@/utils/request-utils'
```
