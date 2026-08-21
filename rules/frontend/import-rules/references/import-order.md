# 导入排序 — 示例

**Good**

```ts
import { ref, computed } from 'vue'
import { get } from 'axios'

import { useAuth } from '@/hooks/use-auth'
import { formatDate } from '@/utils/date'

import type { UserProfile } from '@/api'
import type { Ref } from 'vue'
```

**Bad**

```ts
import type { UserProfile } from '@/api'
import { useAuth } from '@/hooks/use-auth'
import { ref } from 'vue'
import { formatDate } from '@/utils/date'
import { get } from 'axios'
import type { Ref } from 'vue'
```
