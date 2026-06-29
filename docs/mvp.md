# Skills CLI MVP

## 1. MVP Objective

交付一个可运行的 `skills` CLI，让用户可以在任意项目中完成：

- 初始化 skills 配置。
- 选择 AI 工具。
- 选择本地 skills 集合。
- 选择要启用的 skills。
- 生成当前项目内的 skills 文件。
- 后续重新同步。
- 使用 TUI 浏览和启用 skills。

MVP 不追求完整生态，只验证核心工作流是否顺畅。

## 2. MVP Scope

### 2.1 Included

- Node.js / TypeScript CLI。
- 本地 registry。
- 当前项目 `.skillsrc.json`。
- 当前仓库作为默认 skills 集合。
- 本地目录类型的 skills 集合。
- 扫描 `SKILL.md`。
- 读取 `name` 和 `description`。
- `init` 交互式初始化。
- `list` 查看 skills。
- `sync` 重新生成。
- `doctor` 检查配置。
- `tui` 终端可视化选择。
- 通用 adapter 输出到 `.skills/generated/<target>/`。

### 2.2 Excluded

- Web UI。
- 远程 registry。
- Git 自动拉取。
- 版本锁升级策略。
- skill 安全审查。
- 权限沙箱。
- 在线 marketplace。
- 复杂用户账号。
- 自动发布 npm。
- 所有 AI 工具的正式原生 adapter。

## 3. MVP Commands

### 3.1 `skills init`

用途：

在当前项目创建 `.skillsrc.json`，选择 targets、registries、skills，并生成文件。

交互流程：

1. 检查当前目录是否存在 `.skillsrc.json`。
2. 如果不存在，继续。
3. 如果存在，询问：
   - overwrite
   - merge
   - cancel
4. 多选 AI 工具：
   - codex
   - claude
   - cursor
   - deepseek
   - workbuddy
5. 多选 skills 集合：
   - 默认 `mine`
   - 已注册的其他本地集合
6. 选择安装方式：
   - all
   - manual
7. 如果选择 `manual`，展示 skills 多选列表。
8. 展示生成计划。
9. 用户确认。
10. 写入 `.skillsrc.json`。
11. 写入 `.skills/generated/<target>/`。

MVP 中 `recommended` 暂不实现。

### 3.2 `skills list`

用途：

查看本机 registry 中的所有 skills。

输出字段：

- enabled in current project
- registry
- category
- name
- description
- path

示例：

```text
Enabled  Registry  Category   Name          Description
yes      mine      standards  import-rules  规范 TypeScript / Vue 项目中的模块导入方式
no       mine      standards  export-rules  规范 TypeScript / Vue 项目中的模块导出方式
```

参数：

```bash
skills list --json
skills list --registry mine
skills list --enabled
```

### 3.3 `skills sync`

用途：

根据 `.skillsrc.json` 重新生成文件。

行为：

- 读取当前项目 `.skillsrc.json`。
- 读取本机 registry。
- 找到已启用 skills。
- 重新生成 `.skills/generated/<target>/`。
- 更新 `.skillsrc.json` 中的 `generated.managedFiles`。

MVP 简化规则：

- 只管理 `.skills/generated/` 目录下文件。
- 不写入其他 AI 工具原生目录。
- 不覆盖 `.skills/generated/` 之外的文件。
- 可以清理上一轮生成但本轮不再需要的托管文件。

### 3.4 `skills add`

用途：

添加一个本地 skills 集合到 registry。

交互流程：

1. 输入集合名称。
2. 输入本地目录路径。
3. 扫描目录下的 `SKILL.md`。
4. 展示发现的 skills 数量。
5. 确认后写入 `~/.skills/registry.json`。

参数：

```bash
skills add --name team --path /path/to/team-skills
```

### 3.5 `skills remove`

用途：

MVP 只支持从当前项目禁用 skill。

交互流程：

1. 读取当前项目 `.skillsrc.json`。
2. 展示已启用 skills。
3. 多选要禁用的 skills。
4. 更新 `.skillsrc.json`。
5. 询问是否立即执行 `sync`。

MVP 不删除 registry 集合。

### 3.6 `skills doctor`

用途：

检查当前项目配置是否健康。

检查项：

- `.skillsrc.json` 是否存在。
- `.skillsrc.json` JSON 是否合法。
- registry 是否存在。
- registry 路径是否存在。
- 已启用 skill 是否存在。
- `SKILL.md` 是否存在。
- skill name 是否重复。
- `.skills/generated/` 下托管文件是否缺失。

输出等级：

- `ok`
- `warning`
- `error`

### 3.7 `skills tui`

用途：

提供终端可视化管理界面。

MVP 界面：

```text
+----------------+----------------------+----------------------------+
| Registries     | Skills               | Preview                    |
| mine           | [x] import-rules     | import-rules               |
|                | [ ] export-rules     | 规范 TypeScript / Vue ...  |
|                | [x] comment-rules    |                            |
+----------------+----------------------+----------------------------+
| / search  space toggle  s sync  d doctor  q quit                    |
+---------------------------------------------------------------------+
```

MVP 操作：

- 上下移动。
- 搜索。
- 空格启用或禁用。
- `s` 执行 sync。
- `d` 执行 doctor。
- `q` 退出。

## 4. MVP File Structure

建议新增工程结构：

```text
src/
  cli.ts
  commands/
    init.ts
    list.ts
    sync.ts
    add.ts
    remove.ts
    doctor.ts
    tui.ts
  core/
    config.ts
    registry.ts
    scanner.ts
    planner.ts
    generator.ts
    checksum.ts
  adapters/
    generic.ts
  tui/
    app.ts
  types/
    index.ts
```

MVP 只实现 `generic` adapter。

## 5. MVP Config Files

### 5.1 Local Registry

路径：

```text
~/.skills/registry.json
```

格式：

```json
{
  "version": 1,
  "registries": [
    {
      "name": "mine",
      "type": "local",
      "path": "/Users/coderjc/Documents/frontend/project/skills",
      "enabled": true,
      "priority": 100
    }
  ]
}
```

如果 registry 文件不存在：

- 自动创建。
- 自动注册当前 CLI 所在 skills 仓库为 `mine`。

### 5.2 Project Config

路径：

```text
.skillsrc.json
```

格式：

```json
{
  "version": 1,
  "targets": ["codex"],
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
    "managedFiles": [
      {
        "path": ".skills/generated/codex/import-rules/SKILL.md",
        "target": "codex",
        "checksum": "sha256:..."
      }
    ]
  }
}
```

## 6. MVP Generated Output

MVP 使用通用输出目录：

```text
.skills/generated/<target>/<skill-name>/
  SKILL.md
  references/
  agents/
```

示例：

```text
.skills/generated/codex/import-rules/SKILL.md
.skills/generated/codex/import-rules/references/import-order.md
.skills/generated/cursor/comment-rules/SKILL.md
```

生成规则：

- 保留原始 skill 目录结构。
- 复制 `SKILL.md`。
- 复制 `references/`。
- 复制 `agents/`。
- 在生成文件顶部添加 generated marker。
- 记录 checksum。

MVP 不把文件写入 `.codex/`、`.cursor/`、`CLAUDE.md` 等原生位置。

## 7. MVP Skill Scanner

扫描规则：

- 从 registry path 开始递归查找 `SKILL.md`。
- 忽略：
  - `.git`
  - `node_modules`
  - `dist`
  - `build`
  - `.skills`
- 解析 frontmatter。
- 如果没有 frontmatter，使用目录名作为 name。
- category 使用 skill 父级目录名。

示例：

```text
standards/import-rules/SKILL.md
```

解析为：

```json
{
  "category": "standards",
  "name": "import-rules",
  "path": "/absolute/path/standards/import-rules",
  "registry": "mine"
}
```

## 8. MVP Conflict Rules

MVP 必须处理：

- 同一 registry 内重复 name。
- 多 registry 重复 name。
- 选择了不存在的 skill。
- 目标输出路径已存在但不在 `managedFiles` 中。

处理方式：

- 重复 name 展示 registry 和 path，让用户选择具体来源。
- 不存在的 skill 在 `doctor` 中报 error。
- 非托管输出路径冲突时停止写入。

## 9. MVP Implementation Tasks

### 9.1 Foundation

- 初始化 Node.js / TypeScript 项目。
- 增加 CLI entry。
- 增加 lint / format / build 脚本。
- 增加基础类型定义。

### 9.2 Registry

- 实现读取 `~/.skills/registry.json`。
- 实现首次自动创建 registry。
- 实现 `skills add`。
- 实现 registry 路径校验。

### 9.3 Scanner

- 实现 `SKILL.md` 扫描。
- 实现 frontmatter 解析。
- 实现 skill metadata 生成。
- 实现重复 name 检测。

### 9.4 Project Config

- 实现 `.skillsrc.json` 读写。
- 实现配置 schema 校验。
- 实现 managedFiles 记录。

### 9.5 Planner and Generator

- 实现生成计划。
- 实现冲突检测。
- 实现文件复制。
- 实现 generated marker。
- 实现 checksum。
- 实现托管文件清理。

### 9.6 Commands

- 实现 `init`。
- 实现 `list`。
- 实现 `sync`。
- 实现 `add`。
- 实现 `remove`。
- 实现 `doctor`。

### 9.7 TUI

- 实现三栏布局。
- 实现 registry 列表。
- 实现 skills 列表。
- 实现 preview。
- 实现搜索。
- 实现启用/禁用。
- 实现 sync 快捷键。
- 实现 doctor 快捷键。

## 10. Recommended Dependencies

CLI：

- `commander` 或 `cac`
- `@inquirer/prompts`
- `picocolors`
- `ora`

TUI：

- `ink`
- `react`

File system：

- `fs-extra`
- `fast-glob`

Parsing：

- `gray-matter`
- `zod`

Checksum：

- Node.js built-in `crypto`

Testing：

- `vitest`
- `tmp-promise`

## 11. MVP Acceptance Criteria

### 11.1 Init Works

Given 一个空项目。

When 执行：

```bash
skills init
```

Then：

- 可以选择 target。
- 可以选择 registry。
- 可以选择 all 或 manual。
- 生成 `.skillsrc.json`。
- 生成 `.skills/generated/<target>/`。

### 11.2 Sync Is Stable

Given 项目已经初始化。

When 连续执行两次：

```bash
skills sync
```

Then：

- 第二次不产生无意义变化。
- `.skillsrc.json` 中 managedFiles 保持稳定。

### 11.3 List Is Useful

Given registry 中存在多个 skills。

When 执行：

```bash
skills list
```

Then：

- 展示 name。
- 展示 description。
- 展示 registry。
- 展示当前项目是否启用。

### 11.4 Doctor Finds Errors

Given `.skillsrc.json` 中引用了不存在的 skill。

When 执行：

```bash
skills doctor
```

Then：

- 输出 error。
- 指出缺失的 skill name。
- 指出对应 registry。

### 11.5 TUI Can Manage Skills

Given 当前项目已经初始化。

When 执行：

```bash
skills tui
```

Then：

- 可以看到 registry。
- 可以看到 skills。
- 可以搜索。
- 可以启用或禁用 skill。
- 可以执行 sync。

## 12. MVP Done Definition

MVP 完成必须满足：

- 所有 MVP commands 可运行。
- 核心流程有自动化测试。
- 在当前 skills 仓库中可以自举使用。
- 在一个临时空项目中可以初始化并生成文件。
- 文档中提供最小使用说明。
- 不要求发布 npm，但本地 `npm link` 或等价方式可用。
