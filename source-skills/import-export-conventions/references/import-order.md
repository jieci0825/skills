# 导入分组

1. **公共依赖**包括运行环境内置模块、框架和第三方包。核心框架及其紧密关联的依赖优先。
2. **内部依赖**包括项目别名、相对路径和可确认的工作区模块。依据项目配置、包声明和解析结果判断，沿用项目的工作区分组。项目级入口先于相对路径。
3. **纯类型**不分来源，统一用独立的 `import type` 放在末组。

`@vueuse/core` 是第三方包，`@/api` 可以是项目别名。按实际来源归组，保留项目可解析的路径及扩展名。下例的 `@/` 仅为示例。

```ts
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'

import { userApi } from '@/api'
import UserCard from './UserCard.vue'

import type { Ref } from 'vue'
import type { UserInfo } from '@/api'
import type { UserCardProps } from './types'
```

移动导入时保留相关注释和导入属性。指令序言如 `'use client'` 保持原位，动态 `import()` 保留调用位置和时机。

裸导入可在行为不变时按来源归入前两组。Polyfill、全局注册、埋点初始化及 CSS 加载可能有顺序依赖。带绑定的运行时导入也会求值，必要时与依赖顺序的裸导入一起保留原位。只整理确认独立的部分。

例如 `ui-kit` 在加载时需要环境补丁，保留以下顺序。

```ts
import './install-polyfills'
import { mount } from 'ui-kit'

import type { MountOptions } from 'ui-kit'
```
