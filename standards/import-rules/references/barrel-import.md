# 桶导入 — 示例

**Good**

```ts
import { authApi, deviceApi } from '@/api'
```

**Bad**

```ts
import { login } from '@/api/modules/auth'
import { getDeviceList } from '@/api/modules/device'
```
