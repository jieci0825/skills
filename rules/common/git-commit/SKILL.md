---
name: git-commit
description: 根据当前改动生成符合 Conventional Commits 规范的中文 Git 提交信息，并执行提交
---

根据当前可提交改动生成一份中文 Conventional Commits 提交信息，并执行 `git commit`。

## 核心原则

- 优先只检查 Git 暂存区改动
- 若暂存区为空，只允许将“本次任务实际涉及的文件”添加到暂存区
- 禁止使用 `git add .`、`git add -A` 或暂存无关文件
- 禁止读取、分析或提交与本次任务无关的未暂存改动
- 禁止根据历史对话、计划或未进入暂存区的内容补全提交信息
- 禁止执行 `git push`

## 执行流程

1. 使用 `git diff --cached --name-only` 确认暂存区是否有文件
2. 若暂存区为空：

    - 仅将本次任务实际修改、创建或删除的文件加入暂存区
    - 若无法确定本次任务涉及文件，提示“当前没有已暂存改动”，并停止

3. 使用以下命令检查暂存区内容：

    - `git diff --cached`
    - `git diff --cached --name-only`
    - `git status --short` 中与暂存区相关的信息

4. 仅根据暂存区 diff 生成提交信息
5. 执行 `git commit`，使用生成的提交信息作为完整 commit message
6. 提交完成后，明确回报本次实际使用的完整 commit message

## 提交信息格式

默认使用标题加详细说明：

type(scope): description

- 变更点 1
- 变更点 2
- 变更点 3

若改动非常单一，可以只使用标题。

## 标题规则

标题必须为：

type(scope): description

要求：

- `type` 只能使用：`feat`、`fix`、`refactor`、`style`、`docs`、`test`、`build`、`perf`、`ci`、`chore`、`revert`
- `scope` 必须使用中文，概括核心模块、页面、组件、功能域或基础设施层
- 避免使用“项目”“系统”“模块”“功能”等空泛 scope
- `description` 必须使用中文，以动词开头，简洁明确，不加句号
- `description` 聚焦本次主要改动，尽量控制在 10 到 20 个字

示例：

feat(登录): 新增短信验证码登录
fix(消息列表): 修复重复渲染问题
refactor(请求封装): 重构接口错误处理逻辑

## 类型判断

- 新功能：`feat`
- 缺陷修复：`fix`
- 代码重构：`refactor`
- 性能优化：`perf`
- 样式调整：`style`
- 文档更新：`docs`
- 测试相关：`test`
- 构建或依赖调整：`build`
- CI 流程调整：`ci`
- 杂项维护：`chore`
- 回滚提交：`revert`

若同时包含多类改动，选择最核心的一类。

## 详细说明规则

当存在多个明确变更点时，在标题下补充 2 到 5 条说明：

- 每条以 `- ` 开头
- 必须使用中文
- 每条只描述一个具体改动点
- 聚焦实际改动
- 避免重复标题
- 不写“其他优化”“若干调整”等模糊表述

## 禁止提交内容

不要建议或提交以下内容：

- `node_modules`
- `dist`
- `build` 产物

## 输出要求

- 不输出多个候选项
- 不添加额外解释
- 不使用代码块包裹 commit message
- 提交完成后，必须回报最终实际使用的完整 commit message
