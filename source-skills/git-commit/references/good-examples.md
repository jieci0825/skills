# 正确案例

## 暂存区已有改动

`src/login.ts` 的状态是 `MM`，已暂存登录跳转修复，未暂存日志调整。仓库另有未跟踪的草稿。以下操作只提交登录修复。

```bash
git diff --cached
git commit -m 'fix(登录): 修复会话过期后的跳转'
```

## 暂存区为空

本次实现订单状态筛选并新增测试。实现文件混有旧改动，另有未跟踪的草稿。交互暂存时只选筛选相关差异块，确认暂存区仅有筛选和测试，再用下方提交信息完成提交。

```bash
git --literal-pathspecs add -p -- src/order-filter.ts
git --literal-pathspecs add -A -- tests/order-filter.test.ts
git diff --cached
```

## 提交信息

小幅文档修订可只写标题，省略作用域，例如 `docs: 修正订单筛选的使用说明`。订单筛选涉及刷新恢复和分页时，可在正文补充行为。

```text
feat(订单): 支持按状态筛选订单

筛选条件写入 URL，刷新页面后恢复所选状态。
筛选条件变化时回到第一页，避免沿用旧结果的页码。
```
