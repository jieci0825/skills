# Skills CLI 实施计划

> 基于已定稿方案的任务分解。按优先级划分阶段，每个阶段可独立交付、独立验收。
> 实施时按阶段顺序推进，阶段内任务可并行。

## 已定稿的设计决策（背景速览）

| 决策项 | 结论 |
|---|---|
| 分类机制 | 目录约定：`rules/common/`、`rules/frontend/`、`rules/backend/`、`rules/business-*/` |
| 目标工具 | Codex、Claude Code、Cursor、Trae，仅项目级 |
| 安装方式 | 纯复制（非 symlink），副本可独立修改 |
| CLI 形态 | npm 包，`npx` 调用 |
| 项目配置 | 有 `skills.config.json` 优先读取，没有则交互式问答生成 |
| 源仓库 | CLI 托管缓存（`~/.skills/repo`，自动 clone/pull） |
| 更新策略 | checksum 三态比对，绝不覆盖本地修改 |

---

## 阶段 0：仓库重组（P0 · 前置，无 CLI 依赖）

**目标**：把扁平的 `rules/` 重组为分类目录结构，这是后续所有阶段的基础。

**任务**

- [ ] 创建分类目录：`rules/common/`、`rules/frontend/`、`rules/backend/`（先放占位说明）、`rules/business-*/`（按需）
- [ ] 迁移现有 11 个 skills 到对应分类：
  - `common/`：`git-commit`、`file-naming`、`comment-rules`、`logic-comment-rules`、`requirement-first-implementation`、`monorepo-deps`（归类待确认，暂放 common）
  - `frontend/`：`vue3-vue-file-template`、`scss-nesting`、`export-rules`、`import-rules`、`vue-page-structure`
- [ ] 迁移时保持 skill 内部结构不变（`SKILL.md`、`references/`、`agents/` 原样随目录移动）
- [ ] 检查各 `SKILL.md` frontmatter（`name`、`description`）完整，这是后续 scanner 解析的依据
- [ ] 提交 git（重组与功能改动分开提交，便于回溯）

**验收标准**

- `rules/` 下无散落的 skill 目录，全部位于分类目录内
- skill 总数仍为 11，内容无丢失（`git mv` 保留历史）

---

## 阶段 1：四工具目录映射实测（P1 · 研究验证）

**目标**：方案中的映射表是推测值，必须逐工具实测确认目录约定与文件格式要求，避免 install 写错位置或格式不被识别。

**任务**

- [ ] Codex：确认 `.codex/` 下 skill/规则的实际目录约定与文件格式
- [ ] Claude Code：确认 `.claude/skills/<name>/SKILL.md` 约定
- [ ] Cursor：确认 `.cursor/rules/` 是否要求 `.mdc` 格式及 frontmatter 结构（若是，需评估格式转换）
- [ ] Trae：确认 `.trae/rules/` 的文件格式要求
- [ ] 每个工具用 `git-commit` skill 手工放置一份，验证工具能识别并生效
- [ ] 产出最终映射表（含格式适配说明），回填到本文档附录

**验收标准**

- 四个工具各装一个 skill 并确认生效（工具能读到规则）
- 格式差异明确记录（尤其 Cursor 是否需要 `.mdc` 转换）

---

## 阶段 2：CLI 骨架 + 配置驱动 install（P1 · 核心闭环）

**目标**：跑通最小价值链路——有配置文件的项目执行 `install`，完成复制并记录 manifest。

**任务**

- [ ] 初始化 CLI 工程：`package.json`（`bin` 字段、ESM、TypeScript）、`tsconfig.json`、构建方案（tsup 或 tsc）
- [ ] `src/core/checksum.ts`：单文件与目录级哈希计算（目录哈希需对内容归一化，排除顺序干扰）
- [ ] `src/core/scanner.ts`：扫描 `rules/` 产出「分类 → skills 清单」，解析 `SKILL.md` frontmatter 取 name/description
- [ ] `src/core/config.ts`：`skills.config.json` 读写与 schema 校验（`categories` / `tools` / `exclude`）
- [ ] `src/core/registry.ts`：manifest 读写（已装清单、安装时 checksum、目标工具）
- [ ] 缓存管理：`ensureCache()`——`~/.skills/repo` 不存在则 clone，存在则 pull
- [ ] `install` 命令（非交互路径）：读配置 → 展开分类 → 按映射复制到各工具目录 → 写 manifest
- [ ] 复制时处理 skill 内的 `agents/` 子目录（按阶段 1 结论决定分发或跳过）
- [ ] manifest 存放位置定案：建议 `.skills/manifest.json`，进版本控制（不含绝对路径）

**验收标准**

- 在一个测试项目中，写好 `skills.config.json` 后执行 install，四个工具目录产物正确
- manifest 记录每个已装 skill 的安装时 checksum
- 重复执行 install 幂等，不产生脏数据

---

## 阶段 3：交互式 install + list（P2 · 首次体验）

**目标**：无配置的新项目一条命令完成安装，这是日常使用的主入口。

**任务**

- [ ] 交互式问答：多选分类 → 多选工具（检测项目内已存在的 `.codex/` 等目录作默认选中）
- [ ] 问答结果生成并写入 `skills.config.json`，随后走 install 流程
- [ ] `list` 命令：列出缓存源中所有 skills（名称、分类、描述）
- [ ] `list --installed`：对照 manifest 显示项目已装及其状态（是否有更新、是否本地改动）
- [ ] install 完成后输出 `.gitignore` 建议提示（安装目录应排除，团队成员各自 install）

**验收标准**

- 全新项目零配置，一条交互命令完成安装
- `list` 与 `list --installed` 输出信息准确

---

## 阶段 4：update 漂移检测（P2 · 核心价值）

**目标**：实现复制模式下的安全更新，这是方案的核心卖点。

**任务**

- [ ] `update` 命令：pull 缓存 → 读 manifest → 逐 skill 三态比对（源当前 / 本地副本 / 安装时记录）
- [ ] 实现决策表：

| 本地副本 vs 安装时 | 源 vs 安装时 | 动作 |
|---|---|---|
| 一致（未改动） | 有更新 | 覆盖，更新 manifest |
| 不一致（被改过） | 有更新 | 跳过 + 警告，`--force` 可强覆盖 |
| 一致 | 无变化 | 跳过 |
| — | 源已删除 | 交互提示是否清理 |

- [ ] 配置中新勾选但未安装的 skill 在 update 时补装
- [ ] 汇总输出：更新数 / 跳过数 / 冲突数

**验收标准**

- 本地未改 → 源更新后执行 update，副本被安全覆盖
- 本地有修改 → update 不覆盖且有明确警告
- 源删除的 skill 有清理提示
- `--force` 可强制覆盖（覆盖前打印将丢弃的文件）

---

## 阶段 5：remove + 收尾打磨（P3）

**任务**

- [ ] `remove` 命令：按 manifest 卸载对应目录，支持 `remove <skill-name>` 单删与全删，清理 manifest
- [ ] `agents/*.yaml` per-agent 适配策略完整落地（依阶段 1 结论）
- [ ] 错误信息友好化：缓存 clone 失败、网络问题、配置 schema 错误等场景
- [ ] `--help` 与各子命令帮助文档
- [ ] 处理边界：skill 目录名冲突（不同分类同名 skill）、配置引用了不存在的分类

**验收标准**

- remove 后目录与 manifest 干净，不留残余
- 常见错误场景有可读的报错指引

---

## 阶段 6：发布与文档（P3 · 收官）

**任务**

- [ ] 定 npm 包名与发布渠道（public npm / private registry）
- [ ] 验证 `npx <pkg> install` 全流程可用
- [ ] 更新仓库 README：安装、配置格式、命令说明、目录结构
- [ ] 版本号策略：semver，破坏性配置变更升 major

**验收标准**

- 团队成员在他人的项目里 `npx` 一条命令完成安装
- README 足以让新成员无引导上手

---

## 遗留待定项（实施中择机定案）

| 事项 | 说明 | 建议定案时机 |
|---|---|---|
| `monorepo-deps` 归类 | 暂放 `common/`，若强绑定前端 monorepo 可移 `frontend/` | 阶段 0 |
| Cursor `.mdc` 转换 | 若实测要求 `.mdc` 格式，需在复制层加格式转换 | 阶段 1 |
| `agents/openai.yaml` 分发 | 装 Codex 时生效？其他工具忽略？ | 阶段 1 |
| manifest 路径 | 建议 `.skills/manifest.json` 进版本控制 | 阶段 2 |
| monorepo 子项目级配置 | 现按项目根级设计，子项目需求出现时再扩展 | 观望 |
| npm 包名与渠道 | 影响发布方式 | 阶段 6 前 |

---

## 附录：工具映射表（待阶段 1 实测后回填）

| 工具 | 目标目录 | 格式要求 | 实测状态 |
|---|---|---|---|
| Codex | `.codex/` | 待确认 | 未验证 |
| Claude Code | `.claude/skills/<name>/` | SKILL.md | 未验证 |
| Cursor | `.cursor/rules/` | 疑似 `.mdc` | 未验证 |
| Trae | `.trae/rules/` | 待确认 | 未验证 |
