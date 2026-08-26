# Skills

> 具备强烈个人风格的 skills：一套 AI 编码规则源仓库 + 安装 CLI，一条命令分发到 Codex / Claude Code / Cursor / Trae 四个工具（项目级）。

## 它解决什么问题

同一套编码规范，四个 AI 工具各要一份、格式各异、目录不同：

- Codex 读 `.agents/skills/<name>/SKILL.md`
- Claude Code 读 `.claude/skills/<name>/SKILL.md`
- Cursor 只认 `.cursor/rules/<name>.mdc`（单文件规则）
- Trae 读 `.trae/rules/<name>.md`（单文件规则）

本仓库把规则维护在统一的 `rules/` 下，由 CLI 负责目录映射与格式转换；采用**纯复制**模式（非 symlink），副本可独立修改，`update` 时绝不覆盖你的本地改动。

## 快速开始

在目标项目根目录执行：

```bash
npx skills-cli install
# 本地开发 / 私有部署：
npx skills-cli install --source /path/to/skills-repo
```

没有 `skills.config.json` 时会进入交互式问答（选择分类 → 选择工具），生成配置并完成安装。

## 命令

| 命令                      | 作用                                                      |
| ------------------------- | --------------------------------------------------------- |
| `skills install`          | 按配置安装；无配置时交互式问答生成配置                    |
| `skills list`             | 列出源仓库全部可用 skill（名称、分类、描述）              |
| `skills list --installed` | 显示已安装 skill 的状态（有更新 / 本地已修改 / 副本缺失） |
| `skills update`           | 拉取源仓库并安全更新（详见下方决策表）                    |
| `skills update --force`   | 强制覆盖有本地修改的 skill（覆盖前打印将丢弃的文件）      |
| `skills remove <name>...` | 移除指定 skill                                            |
| `skills remove --all`     | 移除全部 skill 并清理 manifest                            |

所有命令支持 `--source <git-url-或本地路径>`；install/update 另支持 `--config <path>` 指定配置路径。

## 配置文件 `skills.config.json`

```json
{
    "categories": ["common", "frontend", "vue"],
    "tools": ["codex", "claude", "cursor", "trae"],
    "exclude": ["monorepo-deps"],
    "source": "https://github.com/jieci0825/skills.git"
}
```

| 字段         | 说明                                                  |
| ------------ | ----------------------------------------------------- |
| `categories` | 勾选的分类，对应 `rules/` 下的一级目录                |
| `tools`      | 目标工具，可选 `codex` / `claude` / `cursor` / `trae` |
| `exclude`    | 可选，排除的 skill 名称                               |
| `source`     | 可选，源仓库 git URL 或本地路径（默认内置仓库）       |

调整 `categories` / `tools` 后重新执行 `install` 即可同步；`exclude` 新增项建议配合 `skills remove <name>` 清理已装产物。

## 安装了什么、装到哪

```
rules/ 源仓库结构            →  目标项目落盘
rules/<分类>/<skill>/          .agents/skills/<skill>/     Codex（整目录复制）
  ├── SKILL.md                 .claude/skills/<skill>/     Claude Code（整目录复制）
  ├── references/              .cursor/rules/<skill>.mdc   Cursor（压平为单文件）
  └── agents/openai.yaml       .trae/rules/<skill>.md      Trae（压平为单文件）
```

- **Codex / Claude Code（目录模型）**：`SKILL.md`、`references/`、`agents/openai.yaml` 原样复制，零转换。
- **Cursor / Trae（单文件模型）**：`SKILL.md` 压平为单规则文件（`description` 直传，`alwaysApply: false` 智能生效）；`references/` 与 `agents/` 不随发。
- 同时写入 `.skills/manifest.json` 记录每个已装 skill 的安装时 checksum——这是安全更新的基准。

## update 决策表（三态比对：源当前 / 本地副本 / 安装时记录）

| 本地副本 | 源     | 动作                                                    |
| -------- | ------ | ------------------------------------------------------- |
| 未改动   | 有更新 | 覆盖，更新 manifest                                     |
| 被改过   | 有更新 | 跳过 + 警告（`--force` 可强覆盖，会先打印将丢弃的文件） |
| 未改动   | 无变化 | 跳过                                                    |
| 缺失     | —      | 修复恢复                                                |
| —        | 已删除 | 交互确认是否清理本地产物                                |

另有：配置中新勾选但未安装的 skill 在 `update` 时自动补装；冲突时以非零码退出，便于 CI 感知。

## 团队协作建议

- `skills.config.json` 与 `.skills/manifest.json` **纳入版本控制**
- 四个安装目录加入 `.gitignore`，团队成员各自执行 `skills install`
- 源仓库规则更新后，成员执行 `skills update` 安全同步

## 源仓库开发

```bash
npm run build      # tsdown 单文件打包到 dist/cli.js
npm run typecheck  # tsc --noEmit
npm run dev        # watch 构建
node dist/cli.js --source . list   # 用本仓库作源直接试用
```

新增 skill：在 `rules/<分类>/` 下建目录，写 `SKILL.md`（frontmatter 必含 `name`、`description`），分类判定与治理原则见 `docs/implementation-plan.md` 附录 B。

## 版本策略

semver。配置文件结构或 manifest 结构的破坏性变更升 major，新增命令/选项升 minor，修复升 patch。
