# 导出排序 — 示例

**模块文件**

**Good**

```ts
export const REQUIRE_VERIFY_KEY: InjectionKey<RequireVerifyFn> = Symbol('requireVerify')

export function useDevicePassword() {
    // ...
}

export type RequireVerifyFn = (action: () => void) => void
```

**Bad**

```ts
export type RequireVerifyFn = (action: () => void) => void
export function useDevicePassword() {
    // ...
}
export const REQUIRE_VERIFY_KEY: InjectionKey<RequireVerifyFn> = Symbol('requireVerify')
```

**桶文件（index.ts）**

**Good**

```ts
export * as authApi from './modules/auth'
export * as deviceApi from './modules/device'

export { executeCommand } from './execute-command'
export * from './common'

export type { LoginResult, UserProfile } from './types/auth'
export type { DeviceItem, Device } from './types/device'
```

**Bad**

```ts
export type { LoginResult } from './types/auth'
export * as authApi from './modules/auth'
export { executeCommand } from './execute-command'
export type { DeviceItem } from './types/device'
export * as deviceApi from './modules/device'
export * from './common'
```
