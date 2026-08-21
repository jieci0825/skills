# 阶段 0：仓库重组实施计划

> 依据 [implementation-plan.md](../../docs/implementation-plan.md) 阶段 0 任务分解。
> 目标：把扁平的 `rules/` 重组为分类目录结构，为后续 CLI scanner（阶段 2）打基础。

## Summary

将 `rules/` 下 11 个扁平放置的 skill 目录，通过 `git mv` 迁移到 `rules/common/`（6 个）与 `rules/frontend/`（5 个）两个分类目录，并为空的 `rules/backend/` 创建占位说明。skill 内部结构（`SKILL.md`、`references/`、`agents/`）原样随目录移动，内容零改动。完成后单独提交 git（不含工作区中既有的 `src/` 删除与 `docs/` 未跟踪变更）。

## Current State Analysis（探索结论）

- 11 个 skill 全部扁平位于 `rules/` 下，无任何分类目录
- 带 `agents/openai.yaml` 的 skill：`comment-rules`、`logic-comment-rules`
- 带 `references/` 的 skill：`export-rules`、`file-naming`、`import-rules`、`scss-nesting`
- **全部 11 个 `SKILL.md` 的 frontmatter（`name` + `description`）已验证完整**，阶段 0 的检查项无需任何修改
- git 工作区有与阶段 0 无关的未提交变更：`src/core/*.ts` 等 5 个文件已删除（未暂存）、`docs/` 未跟踪
- 仓库 README 仅两行标题，无目录结构描述，无需同步更新（README 完整化属于阶段 6）

## Proposed Changes

### 1. 创建分类目录并迁移 6 个 skill 到 `rules/common/`

```bash
mkdir -p rules/common rules/frontend rules/backend
git mv rules/git-commit rules/common/
git mv rules/file-naming rules/common/
git mv rules/comment-rules rules/common/
git mv rules/logic-comment-rules rules/common/
git mv rules/requirement-first-implementation rules/common/
git mv rules/monorepo-deps rules/common/
```

`monorepo-deps` 归类 **common/**（已定案）：规则内容是通用的 monorepo 依赖安装策略，不绑定前端技术栈，backend monorepo 同样适用。

### 2. 迁移 5 个 skill 到 `rules/frontend/`

```bash
git mv rules/vue3-vue-file-template rules/frontend/
git mv rules/scss-nesting rules/frontend/
git mv rules/export-rules rules/frontend/
git mv rules/import-rules rules/frontend/
git mv rules/vue-page-structure rules/frontend/
```

### 3. 新建 `rules/backend/README.md` 占位说明

git 不跟踪空目录，backend 分类需要占位文件才能入库。内容：

```markdown
# Backend Skills

后端方向的 skills 分类目录。

归类标准：仅适用于后端技术栈（服务端、API、数据库等）的规则。

> 当前为占位说明，暂无 skill。新增后端相关规则时放置于此目录。
```

不创建 `rules/business-*/`（实施计划标注「按需」，当前无业务域 skill）。

### 4. git 提交（仅 rules/ 重组）

`git mv` 会自动暂存移动记录，再 `git add rules/backend/README.md` 后提交。暂存区不含 `src/` 删除（未暂存状态）与 `docs/`（未跟踪），直接 `git commit` 不会带入。提交信息沿用仓库现有风格（中文 Conventional Commits）：

```
refactor: 重组 rules 目录为分类结构（common/frontend/backend）
```

## Assumptions & Decisions

| 事项 | 结论 |
|---|---|
| `monorepo-deps` 归类 | **common/**（用户已确认，实施计划遗留待定项就此定案） |
| 提交范围 | 仅提交 rules/ 重组；`src/` 删除与 `docs/` 保持现状，由用户后续自行处理 |
| `business-*/` 目录 | 不创建，无业务域 skill |
| SKILL.md frontmatter | 已验证完整，零改动 |
| README.md | 不改动（极简标题页，完整文档属阶段 6） |

## 验证步骤

1. **目录结构**：`rules/` 下仅剩 `common/`、`frontend/`、`backend/` 三个目录，无散落 skill 目录
2. **数量核对**：`common/` 含 6 个 skill、`frontend/` 含 5 个 skill、`backend/` 仅含 `README.md`，总数 11
3. **内容零丢失**：`git status` 中迁移显示为 `renamed:`（保留历史），无 delete+add；抽查 `comment-rules/agents/openai.yaml`、`export-rules/references/` 等子结构完整随迁
4. **frontmatter 抽查**：迁移后 `common/git-commit/SKILL.md`、`frontend/vue3-vue-file-template/SKILL.md` 等可正常读取
5. **提交隔离**：`git log -1` 显示重组提交；`git status` 中 `src/` 删除与 `docs/` 未跟踪原样保留

## 重组后的目标结构

```
rules/
├── common/
│   ├── git-commit/SKILL.md
│   ├── file-naming/{SKILL.md, references/}
│   ├── comment-rules/{SKILL.md, agents/openai.yaml}
│   ├── logic-comment-rules/{SKILL.md, agents/openai.yaml}
│   ├── requirement-first-implementation/SKILL.md
│   └── monorepo-deps/SKILL.md
├── frontend/
│   ├── vue3-vue-file-template/SKILL.md
│   ├── scss-nesting/{SKILL.md, references/}
│   ├── export-rules/{SKILL.md, references/}
│   ├── import-rules/{SKILL.md, references/}
│   └── vue-page-structure/SKILL.md
└── backend/
    └── README.md（占位）
```
