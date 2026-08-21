# 类型导入分离 — 示例

**Good**

```ts
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
```

**Bad**

```ts
import { ref, computed, type Ref, type ComputedRef } from 'vue'
```
