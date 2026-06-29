# 类型导出分离 — 示例

**定义处 — 直接导出**

```ts
// api/types/auth.ts
export interface LoginResult {
    accessToken: string
    refreshToken: string
}

export interface UserProfile {
    id: number
    username: string
}
```

**桶文件 — 类型再导出必须使用 `export type`**

**Good**

```ts
// api/index.ts
export * as authApi from './modules/auth'

export type { LoginResult, UserProfile } from './types/auth'
```

**Bad**

```ts
// api/index.ts
export * as authApi from './modules/auth'

export { LoginResult, UserProfile } from './types/auth'
```

**模块内再导出外部类型**

```ts
// hooks/use-overview-data.ts
import type { DeviceStats, PondSummary } from '@/api'

export type { DeviceStats, PondSummary }
```
