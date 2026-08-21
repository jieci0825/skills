# export default 受限使用 — 示例

**允许的场景**

```ts
// api/request/index.ts — 单例实例
const jcRequest = new JcRequest({ baseURL: '/api' })
export default jcRequest
```

```ts
// config/index.ts — 配置对象
const config = { port: 3000, host: 'localhost' }
export default config
```

```ts
// auth.route.ts — 路由定义
const router = new Hono()
router.get('/profile', handler)
export default router
```

**禁止的场景**

```ts
// utils/date.ts — 工具函数不应使用 default
export default function formatDate(date: Date) {
    // ...
}
```

```ts
// hooks/use-auth.ts — hooks 不应使用 default
export default function useAuth() {
    // ...
}
```
