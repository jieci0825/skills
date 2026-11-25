# Good 案例

## 已有暂存改动

用户已暂存 `src/login.ts` 的登录跳转修复。工作区里，该文件还有未暂存的日志调整，另有一份未跟踪的草稿。

```text
MM src/login.ts
?? notes/draft.md
```

```bash
git diff --cached
git commit -m 'fix(登录): 修复会话过期后的跳转'
```

此次提交包含登录跳转修复。日志调整和草稿继续留在工作区。标题已说明修复内容，省略正文。

## 暂存区为空

本次对话在 `src/order-filter.ts` 中实现了订单状态筛选，并新增 `tests/order-filter.test.ts`。实现文件里还混有一处旧改动，另有一份未跟踪的草稿。

```text
 M src/order-filter.ts
?? notes/draft.md
?? tests/order-filter.test.ts
```

```bash
git --literal-pathspecs add -p -- src/order-filter.ts
git --literal-pathspecs add -A -- tests/order-filter.test.ts
git diff --cached
```

在交互式暂存中只选状态筛选对应的差异块，再确认暂存区只包含筛选实现和测试。用下方的订单提交信息完成本地提交。

## 提交信息

小幅文档修订用一行中文标题即可。作用域可省略。

```text
docs: 修正订单筛选的使用说明
```

订单筛选同时影响刷新恢复和分页。标题概括功能，正文补充这两个行为。

```text
feat(订单): 支持按状态筛选订单

筛选条件写入 URL，刷新页面后恢复所选状态。
筛选条件变化时回到第一页，避免沿用旧结果的页码。
```
