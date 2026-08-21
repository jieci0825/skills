# 路径别名优先 — 示例

**Good**

```ts
import { useAuth } from '@/hooks/use-auth'
import { formatDate } from '@/utils/date'
```

**Bad**

```ts
import { useAuth } from '../../../hooks/use-auth'
import { formatDate } from '../../../utils/date'
```
