# 类型导入与导出

## 导入类型

在支持 TypeScript 的文件或脚本块中，用独立的 `import type` 导入纯类型。例如将 `import { ref, type Ref } from 'vue'` 拆开。

```ts
import { ref } from 'vue'

import type { Ref } from 'vue'
import type { UserInfo } from '@/api'
```

- 双重含义的符号按用途判断。用于 `new`、类的 `extends`、`instanceof`、枚举成员值或组件渲染时保留值导入。已有的值绑定也可用于类型位置。
- 转换前检查编译配置和框架是否生成运行时引用，如装饰器元数据。确认是纯类型后，若擦除导入会丢失必要加载，可在原求值位置保留独立的副作用导入。
- 普通 JS 文件及 JS 脚本块沿用项目的 JSDoc。生成的 SDK 或协议类型有明确的命名空间约定时，可沿用 `import type * as Name`。

## 公开类型

- 按项目风格在定义处用 `export interface` 或 `export type` 声明公开类型。所属入口用 `export type { UserInfo, UserStatus } from './types'` 逐项列出，与值再导出分开。作为运行时 API 公开的类或枚举用值再导出即可保留类型含义。
- 私有类型就近定义，确实跨模块共享时沿用项目的共享类型位置。跨文件公开前核对调用方和声明输出，避免意外增加运行时导出或擦除已公开的值。
