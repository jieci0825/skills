# Skills CLI PRD

## 1. Product Summary

`skills` 是一个面向 AI 编程工具的本地 skills 管理 CLI。

它允许用户在任意项目中通过命令行或 TUI 完成以下操作：

- 选择当前项目使用的 AI 工具，例如 Codex、Claude、Cursor、DeepSeek、WorkBuddy。
- 选择一个或多个 skills 集合，例如个人集合、团队集合、第三方本地集合。
- 选择要应用到当前项目的具体 skills。
- 根据配置在当前项目中生成适配不同 AI 工具的目录和文件。
- 后续可以查看、同步、增删、诊断当前项目的 skills 配置。

第一阶段优先交付 CLI + TUI。Web UI 暂不实现。

## 2. Background

当前仓库已经存在一批以 `SKILL.md` 为核心的 skills：

- `standards/*/SKILL.md`
- `decision/*/SKILL.md`
- 可选资源目录：`references/`
- 可选工具适配文件：`agents/*.yaml`

当前问题不是 skill 内容不可用，而是缺少统一的安装、选择、分发和适配机制。

用户希望在新项目中不再手动复制 skills，而是通过命令完成初始化和后续管理。

## 3. Goals

### 3.1 Product Goals

- 将当前 skills 仓库升级为可复用的 CLI 工具。
- 支持在任意项目中初始化 skills 配置。
- 支持多 AI 工具适配。
- 支持多 skills 集合来源。
- 支持按项目选择全部、推荐或手动选择 skills。
- 支持 TUI 管理本地配置和 skills 集合。
- 为后续 Web UI、远程 registry、版本锁定预留结构。

### 3.2 User Goals

- 新建项目后，可以快速启用自己常用的 AI coding 规则。
- 同一个项目可以同时适配多个 AI 工具。
- 可以按项目类型选择合适的 skills，而不是每次全部复制。
- 可以查看当前项目启用了哪些 skills。
- 可以同步 skills 集合的变化到当前项目。
- 可以管理本地 skills 集合。

## 4. Non-goals

以下能力不在第一阶段实现：

- Web UI。
- skills 安全扫描。
- 权限沙箱。
- 远程 skill 自动执行。
- 在线 marketplace。
- 复杂版本升级策略。
- 跨机器账号体系。
- 云端同步。
- 自动判断所有 AI 工具的最新官方文件格式。

## 5. Target Users

### 5.1 Primary User

个人开发者。

特征：

- 同时使用一个或多个 AI 编程工具。
- 有自己的编码规范、提交规范、项目结构规范。
- 希望这些规则可以在多个项目中复用。

### 5.2 Secondary User

小团队维护者。

特征：

- 希望将团队规范沉淀为 skills 集合。
- 希望成员在项目初始化时统一安装规则。
- 需要在不同项目中选择不同规则组合。

## 6. Core Concepts

### 6.1 Skill

一个独立的 AI 行为规则单元。

标准目录结构：

```text
<category>/<skill-name>/
  SKILL.md
  references/
  agents/
```

必须包含：

- `SKILL.md`

建议包含 frontmatter：

```yaml
---
name: import-rules
description: 规范 TypeScript / Vue 项目中的模块导入方式
---
```

### 6.2 Skill Collection

一个 skills 集合，可以来自：

- 当前仓库。
- 本地目录。
- 后续扩展为 Git 仓库。
- 后续扩展为远程 registry。

集合可以包含多个分类和多个 skill。

### 6.3 Registry

本机已知的 skills 集合清单。

Registry 负责记录：

- 集合名称。
- 集合来源。
- 本地路径。
- 启用状态。
- 默认优先级。

### 6.4 Target

目标 AI 工具，例如：

- `codex`
- `claude`
- `cursor`
- `deepseek`
- `workbuddy`

Target 不是简单标签，而是一个输出适配目标。

### 6.5 Adapter

Adapter 负责将通用 skill 转换为目标 AI 工具可读取的文件结构。

每个 target 都应该有独立 adapter。

Adapter 的输入：

- 当前项目路径。
- 项目配置。
- 已选择 skills。
- skill 源文件。

Adapter 的输出：

- 当前项目中的目录。
- 当前项目中的规则文件。
- 生成记录。

### 6.6 Project Config

当前项目的 skills 配置文件。

默认文件名：

```text
.skillsrc.json
```

作用：

- 记录当前项目选择了哪些 targets。
- 记录当前项目选择了哪些 registries。
- 记录当前项目启用了哪些 skills。
- 记录生成状态。
- 支持后续 `sync`、`remove`、`doctor`。

## 7. User Flows

### 7.1 Initialize Project

命令：

```bash
skills init
```

流程：

1. 检测当前目录是否已经存在 `.skillsrc.json`。
2. 如果存在，询问覆盖、合并或退出。
3. 选择当前项目使用的 AI 工具，可多选。
4. 选择 skills 集合，可多选。
5. 扫描当前项目类型。
6. 选择 skills 安装策略：
   - `all`：安装当前项目兼容的全部 skills。
   - `recommended`：安装根据项目类型推荐的 skills。
   - `manual`：手动多选。
7. 展示将要生成的文件预览。
8. 用户确认。
9. 写入 `.skillsrc.json`。
10. 执行 adapter 生成文件。
11. 输出结果摘要。

### 7.2 List Skills

命令：

```bash
skills list
```

能力：

- 查看所有已注册集合中的 skills。
- 支持按集合过滤。
- 支持按 target 过滤。
- 支持按项目适用性过滤。
- 标记当前项目已启用的 skills。

### 7.3 Sync Skills

命令：

```bash
skills sync
```

能力：

- 读取 `.skillsrc.json`。
- 重新扫描已启用 skill 的源文件。
- 根据当前配置重新生成目标工具文件。
- 删除上一轮生成但本轮不再需要的托管文件。
- 输出新增、修改、删除摘要。

### 7.4 Add Collection

命令：

```bash
skills add
```

能力：

- 添加本地 skills 集合。
- 为集合设置名称。
- 校验集合目录结构。
- 更新本机 registry。

### 7.5 Remove Skill or Collection

命令：

```bash
skills remove
```

能力：

- 从当前项目中移除某个 skill。
- 从本机 registry 中移除某个集合。
- 移除后可以选择立即 sync。

### 7.6 Diagnose Project

命令：

```bash
skills doctor
```

能力：

- 检查 `.skillsrc.json` 是否存在。
- 检查 registry 路径是否存在。
- 检查已启用 skills 是否存在。
- 检查重复 skill name。
- 检查 reference 文件是否缺失。
- 检查 adapter 是否支持当前 target。
- 检查生成文件是否被用户手动修改。

### 7.7 TUI Management

命令：

```bash
skills tui
```

能力：

- 浏览 registry。
- 浏览 skills。
- 搜索 skills。
- 查看 skill 描述。
- 查看 skill 文件路径。
- 查看当前项目启用状态。
- 启用或禁用 skills。
- 选择 targets。
- 执行 sync。
- 查看 doctor 结果。

## 8. Functional Requirements

### 8.1 CLI

必须支持：

- `skills init`
- `skills list`
- `skills sync`
- `skills add`
- `skills remove`
- `skills doctor`
- `skills tui`

命令必须支持：

- `--help`
- `--cwd <path>`
- `--json`

`--json` 用于后续 Web UI 或脚本调用。

### 8.2 Interactive Prompts

交互选择必须支持：

- 单选。
- 多选。
- 默认值。
- 搜索。
- 返回上一步。
- 取消操作。

取消操作不得写入任何文件。

### 8.3 Project Detection

初始化时应扫描：

- 是否存在 `package.json`。
- 是否存在 `pnpm-workspace.yaml`、`turbo.json`、`nx.json`。
- 是否存在 `vite.config.*`。
- 是否存在 `vue`、`react`、`typescript` 相关依赖。
- 是否存在 `.git`。

输出项目标签：

- `typescript`
- `vue`
- `react`
- `node`
- `monorepo`
- `unknown`

项目标签用于推荐 skills，不用于阻止用户手动选择。

### 8.4 Skill Discovery

扫描集合时必须识别：

```text
*/SKILL.md
```

从 `SKILL.md` 读取：

- `name`
- `description`

如果缺失 `name`：

- 使用目录名作为 fallback。
- 在 `doctor` 中给出 warning。

如果缺失 `description`：

- 使用空字符串。
- 在 `doctor` 中给出 warning。

### 8.5 Skill Manifest

第一阶段允许没有集合级 manifest。

后续建议支持：

```json
{
  "name": "jc-skills",
  "owner": "coderjc",
  "version": "0.1.0",
  "skills": [
    {
      "name": "import-rules",
      "path": "standards/import-rules",
      "tags": ["typescript", "vue", "standard"],
      "targets": ["codex", "cursor", "claude"],
      "projectTypes": ["vue", "typescript"]
    }
  ]
}
```

第一阶段可以通过目录扫描生成内存态 manifest。

### 8.6 Registry Config

本机 registry 默认存储位置：

```text
~/.skills/registry.json
```

结构：

```json
{
  "version": 1,
  "registries": [
    {
      "name": "mine",
      "type": "local",
      "path": "/absolute/path/to/skills",
      "enabled": true,
      "priority": 100
    }
  ]
}
```

### 8.7 Project Config

`.skillsrc.json` 结构：

```json
{
  "version": 1,
  "targets": ["codex", "cursor"],
  "registries": ["mine"],
  "selection": {
    "mode": "manual",
    "skills": [
      {
        "name": "import-rules",
        "registry": "mine"
      }
    ]
  },
  "generated": {
    "managedFiles": []
  }
}
```

要求：

- 所有路径写绝对路径或可稳定解析的 registry 名称。
- 不把完整 skill 内容写入配置文件。
- `generated.managedFiles` 只记录工具生成并托管的文件。

### 8.8 Conflict Handling

冲突类型：

- 不同集合存在同名 skill。
- 同一 target 生成同一路径文件。
- 生成文件已存在且不是本工具托管。
- 已托管文件被用户手动修改。

处理策略：

- 同名 skill 默认按 registry priority 排序。
- 手动选择时必须展示来源。
- 生成路径冲突时必须停止并提示。
- 非托管文件不得覆盖，除非用户明确确认。
- 托管文件被修改时，`sync` 默认保留并提示，用户可选择覆盖。

### 8.9 Adapter Output Contract

每个 adapter 必须实现：

```ts
interface TargetAdapter {
  target: string
  detect?(cwd: string): Promise<boolean>
  plan(input: AdapterInput): Promise<AdapterPlan>
  apply(plan: AdapterPlan): Promise<AdapterResult>
}
```

`plan` 只计算，不写文件。

`apply` 执行写入。

`AdapterPlan` 必须包含：

- 将创建的文件。
- 将修改的文件。
- 将删除的托管文件。
- 冲突列表。

### 8.10 Generated File Ownership

工具生成的文件必须带有可识别标记。

示例：

```text
<!-- Generated by skills CLI. Do not edit directly unless you intend to take ownership. -->
```

如果目标文件格式不支持注释，则必须在 `.skillsrc.json` 中记录 checksum。

### 8.11 TUI Requirements

TUI 布局：

```text
+----------------+----------------------+----------------------------+
| Registries     | Skills               | Preview                    |
|                |                      |                            |
| mine           | [x] import-rules     | name                       |
| team           | [ ] export-rules     | description                |
|                | [x] comment-rules    | source path                |
|                |                      | targets                    |
+----------------+----------------------+----------------------------+
| / search  space toggle  tab switch  s sync  d doctor  q quit        |
+---------------------------------------------------------------------+
```

必须支持：

- 键盘导航。
- 搜索。
- 多选。
- 详情预览。
- 当前项目启用状态展示。
- 执行 sync。
- 执行 doctor。

## 9. Adapter Strategy

### 9.1 Principle

通用 skill 内容不直接假设目标工具格式。

目标工具格式由 adapter 决定。

### 9.2 Initial Targets

第一阶段内置 target 名称：

- `codex`
- `claude`
- `cursor`
- `deepseek`
- `workbuddy`

实现优先级：

1. `codex`
2. `cursor`
3. `claude`
4. `deepseek`
5. `workbuddy`

如果某个 target 的真实格式暂未确认，adapter 可以先输出到统一托管目录：

```text
.skills/generated/<target>/
```

并在 `doctor` 中提示该 target 需要补充正式 adapter。

### 9.3 Codex Adapter

Codex adapter 第一阶段目标：

- 保留原始 `SKILL.md`。
- 保留 `references/`。
- 保留必要 `agents/` 信息。
- 生成到当前项目可追踪目录。

具体最终目录结构需要在实现前根据 Codex 当前项目级 skills 支持方式确认。

### 9.4 Cursor Adapter

Cursor adapter 第一阶段目标：

- 将 skill 内容转换为 Cursor 可读取的规则文件。
- 如果目标格式未确认，则先生成到 `.skills/generated/cursor/`。

具体最终目录结构需要在实现前根据 Cursor 当前规则文件格式确认。

### 9.5 Claude Adapter

Claude adapter 第一阶段目标：

- 将多个 skills 聚合成 Claude 可读取的项目级指导文件。
- 如果目标格式未确认，则先生成到 `.skills/generated/claude/`。

具体最终目录结构需要在实现前根据 Claude 当前项目级配置方式确认。

### 9.6 DeepSeek Adapter

DeepSeek adapter 第一阶段目标：

- 提供通用 markdown 输出。
- 如果没有项目级规则格式，则生成可复制的规则文件。

### 9.7 WorkBuddy Adapter

WorkBuddy adapter 第一阶段目标：

- 提供通用 markdown 输出。
- 后续根据 WorkBuddy 实际配置格式补充正式 adapter。

## 10. Data Model

### 10.1 SkillInfo

```ts
interface SkillInfo {
  name: string
  description: string
  category: string
  registry: string
  path: string
  tags: string[]
  targets: string[]
  projectTypes: string[]
  hasReferences: boolean
  hasAgentConfig: boolean
}
```

### 10.2 RegistryInfo

```ts
interface RegistryInfo {
  name: string
  type: 'local'
  path: string
  enabled: boolean
  priority: number
}
```

### 10.3 ProjectConfig

```ts
interface ProjectConfig {
  version: 1
  targets: string[]
  registries: string[]
  selection: {
    mode: 'all' | 'recommended' | 'manual'
    skills: Array<{
      name: string
      registry: string
    }>
  }
  generated: {
    managedFiles: Array<{
      path: string
      target: string
      checksum: string
    }>
  }
}
```

## 11. Error Handling

### 11.1 Required Behavior

- 所有写文件操作前必须生成 plan。
- plan 存在 conflict 时默认不写文件。
- 用户取消时不得留下部分写入。
- sync 失败时必须输出失败阶段。
- 任何命令支持 `--json` 时必须返回结构化错误。

### 11.2 Common Errors

- `CONFIG_NOT_FOUND`
- `REGISTRY_NOT_FOUND`
- `SKILL_NOT_FOUND`
- `DUPLICATE_SKILL`
- `ADAPTER_NOT_FOUND`
- `OUTPUT_CONFLICT`
- `MANAGED_FILE_MODIFIED`
- `INVALID_SKILL_FRONTMATTER`

## 12. Success Metrics

第一阶段成功标准：

- 在空项目中执行 `skills init` 可以完成初始化。
- 在已有项目中执行 `skills init` 可以选择 target、registry、skills。
- 执行 `skills sync` 可以稳定重复生成。
- 执行 `skills list` 可以展示可用和已启用 skills。
- 执行 `skills doctor` 可以发现缺失 skill、重复 skill、输出冲突。
- TUI 可以完成浏览、选择、启用、禁用、同步。

## 13. Milestones

### Milestone 1: Core CLI

- 项目初始化。
- registry 读取。
- skill 扫描。
- project config 写入。
- 通用 adapter 输出。

### Milestone 2: Sync and Doctor

- 托管文件记录。
- checksum。
- sync。
- doctor。
- 冲突检测。

### Milestone 3: TUI

- registry 列表。
- skills 列表。
- skill 预览。
- 多选启用。
- sync。
- doctor。

### Milestone 4: Formal Adapters

- Codex adapter。
- Cursor adapter。
- Claude adapter。
- DeepSeek adapter。
- WorkBuddy adapter。

### Milestone 5: Future Web UI

- 将 CLI 核心逻辑拆成可复用 package。
- Web UI 调用同一套 service。
- 支持可视化 CRUD。

## 14. Acceptance Criteria

### 14.1 Init

- 给定一个没有 `.skillsrc.json` 的项目。
- 当用户执行 `skills init`。
- 用户可以完成 target、registry、skills 选择。
- 工具生成 `.skillsrc.json`。
- 工具生成目标目录和文件。
- 再次执行 `skills sync` 不产生无意义 diff。

### 14.2 List

- 给定本机至少一个 registry。
- 当用户执行 `skills list`。
- 工具展示 registry、skill name、description、enabled 状态。

### 14.3 Sync

- 给定已有 `.skillsrc.json`。
- 当用户执行 `skills sync`。
- 工具重新生成所有托管文件。
- 不覆盖非托管文件。
- 对被手动修改的托管文件给出提示。

### 14.4 Doctor

- 给定配置中引用了不存在的 skill。
- 当用户执行 `skills doctor`。
- 工具输出明确错误和修复建议。

### 14.5 TUI

- 给定当前项目。
- 当用户执行 `skills tui`。
- 用户可以查看、搜索、启用、禁用 skills。
- 用户可以触发 sync。
- 用户可以查看 doctor 结果。
