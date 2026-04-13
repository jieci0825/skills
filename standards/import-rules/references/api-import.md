# API 导入风格 — 示例

**Good**

```ts
import { authApi, deviceApi } from '@/api'

authApi.login(params)
deviceApi.getDeviceList()
```

**Bad**

```ts
import { login } from '@/api/modules/auth'
import { getDeviceList } from '@/api/modules/device'

login(params)
getDeviceList()
```
