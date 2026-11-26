# 模块导出

## 业务 API

实现文件具名导出请求函数，命名和实现沿用项目约定。入口按业务域聚合为 `xxxApi`，调用方可一次导入多个域。公开类型单独具名导出。

```ts
// api/user.ts
import { request } from '@/utils'

import type { UserInfo } from './types'

export function reqGetUserInfo() {
    return request.get<UserInfo>('/user/info')
}
```

```ts
// api/index.ts
export * as userApi from './user'
export * as orderApi from './order'

export type { UserInfo } from './types'
```

```ts
import { orderApi, userApi } from '@/api'

import type { UserInfo } from '@/api'

const user: UserInfo = await userApi.reqGetUserInfo()
const orders = await orderApi.reqGetOrderList()
```

`export * as` 会收纳目标模块的运行时导出，确保其中只有该域拟公开的请求成员。若实现文件还需保留其他导出，可用显式再导出公开成员的子入口作为来源。

## 工具与其他模块

独立工具具名导出，调用方按需导入。同一对象的一组操作可按调用语义聚合，如 `storage.get`、`storage.set`、`storage.remove`。Hooks、Composables、Store、常量和类也优先具名导出。

```ts
// utils/index.ts
export { formatDate, getTimestamp } from './date'
export { isEmail } from './validator'

export * as storage from './storage'

export type { DateFormatOptions } from './date'
```

调用方可直接导入 `formatDate` 和 `storage`，再调用 `formatDate(new Date())` 和 `storage.get('locale')`。

框架配置、组件和路由页面可按框架约定默认导出。公开具名组件可写成 `export { default as UserCard } from './UserCard.vue'`。

## 公开入口

- 沿用已有 `index.ts`、`index.js` 或包公开入口，仅在需集中维护多个公开成员时新增聚合入口。
- 外部从公开入口导入，内部直引实现文件，如 `./validator`，避免经自身入口形成循环依赖。
- 显式列出新增公开成员。除非任务包含兼容迁移，保留既有 `export * from` 或深层导入承载的公开契约。检查意外公开、命名冲突和运行时依赖。
- 再导出也可能触发模块求值。初始化依赖优先，安全时按具名值、命名空间、纯类型排布。
