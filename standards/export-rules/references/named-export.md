# 命名导出优先 — 示例

**Good**

```ts
export function login(data: LoginParams): Promise<LoginResult> {
    return jcRequest.post({ url: '/auth/login', data })
}

export function getProfile(): Promise<UserProfile> {
    return jcRequest.get({ url: '/auth/profile' })
}
```

**Bad**

```ts
function login(data: LoginParams): Promise<LoginResult> {
    return jcRequest.post({ url: '/auth/login', data })
}

function getProfile(): Promise<UserProfile> {
    return jcRequest.get({ url: '/auth/profile' })
}

export default { login, getProfile }
```
