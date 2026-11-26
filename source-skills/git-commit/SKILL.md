---
name: git-commit
description: 在用户要求提交改动时创建本地 Git 提交。有暂存改动时只提交暂存内容，暂存区为空时只暂存并提交本次对话修改的功能文件。使用中文约定式提交信息，完成本地提交即结束。
---

# Git 提交规范

在当前任务对应的工作树创建一次普通的本地提交。

1. 检查仓库状态，按[暂存与提交范围](references/staging-scope.md)决定是否暂存。有未解决的冲突或正在合并、变基等操作时，先明确请求是否包含继续该操作。
2. 用 `git diff --cached --stat` 和 `git diff --cached` 核对暂存内容。没有可提交改动时说明原因并结束，否则按差异撰写[中文提交信息](references/commit-message.md)。
3. 提交前复核暂存范围，用不带路径的 `git commit` 提交。失败时检查错误和仓库状态，沿用项目的提交检查与签名要求。
4. 确认新提交已生成，核对提交内容和剩余工作区状态，报告哈希和标题后结束。

按需参考[正确操作和标题、正文示例](references/good-examples.md)，以及[扩大提交范围和提交信息的常见错误](references/bad-examples.md)。
