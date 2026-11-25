# 类型导入与导出

## 导入类型

在支持 TypeScript 的文件或脚本块中，将仅用于类型位置的成员写成独立的 `import type`。同一来源同时提供值和类型时，把 `import { ref, type Ref } from 'vue'` 拆成两条语句。

```ts
import { ref } from 'vue'

import type { Ref } from 'vue'
import type { UserInfo } from '@/api'
```

- 同时具有值和类型含义的符号按实际用途判断。若用于 `new`、类的 `extends`、`instanceof`、枚举成员值或作为组件渲染，保留值导入。同一绑定已经导入为值时可直接用在类型位置。
- 转换既有导入前，确认项目编译配置或框架是否会生成运行时引用，例如装饰器元数据。确认绑定只用于类型后，再检查擦除该导入是否会移除必要的模块加载；若会移除，可在原有求值位置保留独立的副作用导入。
- 在普通 JavaScript 文件及 JavaScript 脚本块中沿用项目的 JSDoc 类型写法。生成的 SDK 或协议类型有明确的命名空间约定时，可以沿用 `import type * as Name`。

## 公开类型

在定义处按项目现有风格用 `export interface` 或 `export type` 声明公开类型。模块入口通过 `export type { Name } from './module'` 逐个列出类型，值再导出单独书写。当一个类或枚举需要作为运行时 API 对外提供时，使用值再导出即可同时保留其类型含义。

```ts
// api/types.ts
export interface UserInfo {
    id: string
    name: string
}

export type UserStatus = 'active' | 'disabled'
```

```ts
// api/index.ts
export * as userApi from './user'

export type { UserInfo, UserStatus } from './types'
```

仅在实现内部使用的类型留在实现附近。模块的公开类型从所属入口导出，确实被多个模块共享时再沿用项目的共享类型位置。跨文件暴露类型前核对调用方和声明输出，避免把只有类型的成员变成运行时导出，或擦除已经公开的值。
