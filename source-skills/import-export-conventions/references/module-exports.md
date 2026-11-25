# 模块导出

## 业务 API

在业务实现文件中具名导出请求函数。公开入口以业务域聚合，使用 `xxxApi` 命名空间。调用方可在一条导入语句取用多个业务域，再以命名空间调用。

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

`export * as` 会把目标模块的运行时导出纳入命名空间。检查目标是否只有该业务域拟公开的请求成员。需要保留实现文件中的其他现有导出时，可以用一个显式再导出公开成员的子入口作为命名空间来源。公开类型单独从 API 入口以具名形式暴露。请求函数的命名和请求实现沿用项目约定。

## 工具与其他模块

独立的 `formatDate`、`isEmail` 等函数使用具名导出，调用方直接导入所需成员。围绕同一对象的一组操作可以形成命名空间，例如 `storage.get`、`storage.set`、`storage.remove`。是否聚合由调用语义决定。Hooks、Composables、Store、常量及类也优先使用具名导出。

```ts
// utils/index.ts
export { formatDate, getTimestamp } from './date'
export { isEmail } from './validator'

export * as storage from './storage'

export type { DateFormatOptions } from './date'
```

```ts
import { formatDate, storage } from '@/utils'

formatDate(new Date())
storage.get('locale')
```

框架配置、组件文件和路由页面可以按框架约定使用默认导出。需要将组件暴露为公开具名成员时，可使用 `export { default as UserCard } from './UserCard.vue'`。

## 公开入口

- 使用项目已有的 `index.ts`、`index.js` 或包公开入口。只有需要集中维护多个对外成员时才新增聚合入口。
- 外部调用方从公开入口导入。模块内部直接引用 `./validator` 等实现文件，避免通过自身入口形成循环依赖。
- 新增公开成员时显式列出名称。保留既有 `export * from` 或深层导入所承载的公开契约，除非任务包含兼容迁移。检查入口修改是否引入意外公开成员、命名冲突或运行时依赖。
- 仅在安全时按具名值、命名空间、纯类型的顺序排布再导出。再导出也可能触发目标模块求值，初始化依赖优先于分组。
