# 导入分组

## 判断来源

1. **公共依赖**包括运行环境内置模块、框架和第三方包。
2. **项目内部依赖**包括项目别名、相对路径和可确认属于本工作区的模块。通过项目配置、包声明及实际解析结果判断。对于项目已有工作区分组规则的情况，沿用项目规则。
3. **纯类型**来自任一来源，统一在最后以独立的 `import type` 导入。

`@vueuse/core` 是第三方包，`@/api` 可以是项目别名。两种路径都以 `@` 开头，判断依据仍是配置和实际来源。保留项目可解析的原路径及扩展名。`@/` 仅用于下面的示例。

```ts
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'

import { userApi } from '@/api'
import { formatDate } from '@/utils'
import UserCard from './UserCard.vue'

import type { Ref } from 'vue'
import type { UserInfo } from '@/api'
import type { UserCardProps } from './types'
```

公共依赖组将核心框架及其紧密关联的依赖放在前面，内部依赖组将项目级入口放在相对路径前面。移动导入语句时一并保留相关的注释和导入属性。文件或脚本块中有指令序言时，例如 `'use client'`，让它保持在原有位置。动态 `import()` 依照原调用位置和时机执行。

## 保留加载顺序

裸导入按来源归入前两组，前提是移动不会改变行为。Polyfill、全局注册、埋点初始化及 CSS 加载可能依赖相对顺序。带绑定的运行时导入也会求值，必要时将它与依赖顺序的裸导入原位保留。仅整理能确认独立的部分。

下例假设 `ui-kit` 在加载时就依赖项目先安装环境补丁，因此保留这个顺序。

```ts
import './install-polyfills'
import { mount } from 'ui-kit'

import type { MountOptions } from 'ui-kit'
```
