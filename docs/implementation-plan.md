# Skills CLI 实施计划

> 基于已定稿方案的任务分解。按优先级划分阶段，每个阶段可独立交付、独立验收。
> 实施时按阶段顺序推进，阶段内任务可并行。

## 已定稿的设计决策（背景速览）

| 决策项   | 结论                                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 分类机制 | 平铺多分类（一层目录）：`common/`、`frontend/`、`vue/`、`react/`、`backend/`、`business-*/`（按需）。分类是可组合的勾选项而非项目类型枚举，治理原则见附录 B |
| 目标工具 | Codex、Claude Code、Cursor、Trae，仅项目级                                                                                                                  |
| 安装方式 | 纯复制（非 symlink），副本可独立修改                                                                                                                        |
| CLI 形态 | npm 包，`npx` 调用                                                                                                                                          |
| 项目配置 | 有 `skills.config.json` 优先读取，没有则交互式问答生成                                                                                                      |
| 源仓库   | CLI 托管缓存（`~/.skills/repo`，自动 clone/pull）                                                                                                           |
| 更新策略 | checksum 三态比对，绝不覆盖本地修改                                                                                                                         |

---

## 阶段 0：仓库重组（P0 · 前置，无 CLI 依赖）✅ 已完成

**目标**：把扁平的 `rules/` 重组为平铺多分类目录结构，这是后续所有阶段的基础。

**任务**

- [x] 创建分类目录：`rules/common/`、`rules/frontend/`、`rules/vue/`、`rules/backend/`、`rules/react/`（占位）；`rules/business-*/` 按需创建
- [x] 迁移现有 11 个 skills 到对应分类：
    - `common/`：`git-commit`、`file-naming`、`comment-rules`、`logic-comment-rules`、`requirement-first-implementation`、`monorepo-deps`（已定案归 common：通用的 monorepo 依赖策略，不绑定前端技术栈）
    - `frontend/`：`scss-nesting`、`export-rules`、`import-rules`（前端领域通用，不绑定具体框架）
    - `vue/`：`vue3-vue-file-template`、`vue-page-structure`（离开 Vue 无意义）
- [x] 迁移时保持 skill 内部结构不变（`SKILL.md`、`references/`、`agents/` 原样随目录移动）
- [x] 检查各 `SKILL.md` frontmatter（`name`、`description`）完整，这是后续 scanner 解析的依据
- [x] 提交 git（重组与功能改动分开提交，便于回溯）

**验收标准**

- `rules/` 下无散落的 skill 目录，全部位于分类目录内
- skill 总数仍为 11，内容无丢失（`git mv` 保留历史）

---

## 阶段 1：四工具目录映射实测（P1 · 研究验证）✅ 已完成

**目标**：方案中的映射表是推测值，必须逐工具实测确认目录约定与文件格式要求，避免 install 写错位置或格式不被识别。

**任务**

- [x] Codex：项目级目录为 `.agents/skills/`（官方文档口径，`.codex/skills/` 实测同样生效，定案采用 `.agents/skills/`）；格式为 `SKILL.md`（frontmatter 必含 `name`、`description`），源仓库结构零转换
- [x] Claude Code：确认 `.claude/skills/<name>/SKILL.md` 约定（`SKILL.md` 大小写敏感，目录名 kebab-case，`description` 必填），源仓库结构零转换
- [x] Cursor：确认 `.cursor/rules/` **必须** `.mdc` 扩展名（`.md` 会被忽略），frontmatter 为 `description` / `globs` / `alwaysApply` 三字段——install 复制层需做格式转换（详见附录 A）
- [x] Trae：确认 `.trae/rules/` 为 `.md` 文件 + 同 Cursor 的三字段 frontmatter（`alwaysApply` / `globs` / `description`），支持子目录嵌套（≤3 层）——install 复制层同样需格式转换
- [x] 每个工具用 `git-commit` skill 手工放置一份并验证（产物保留在仓库根：`.agents/skills/git-commit/`、`.claude/skills/git-commit/`、`.cursor/rules/git-commit.mdc`、`.trae/rules/git-commit.md`）
- [x] 产出最终映射表（含格式适配说明），回填到本文档附录 A

**验收标准**

- 四个工具各装一个 skill 并确认生效（工具能读到规则）
    - Codex：`codex debug prompt-input` 确认 skill（name + description + 路径）已注入模型可见输入 ✅
    - Claude Code：官方 CLI `claude plugin validate .claude/skills` 校验通过（v2.1.238）✅
    - Cursor / Trae：官方文档格式确认 + 已按格式放置（两者无离线校验通道，规则将在后续实际使用中持续观察）
- 格式差异明确记录（尤其 Cursor 是否需要 `.mdc` 转换）：**需要**，且 Trae 同样需要压平转换（见附录 A「转换规则」）

---

## 阶段 2：CLI 骨架 + 配置驱动 install（P1 · 核心闭环）✅ 已完成

**目标**：跑通最小价值链路——有配置文件的项目执行 `install`，完成复制并记录 manifest。

**任务**

- [x] 初始化 CLI 工程：`package.json`（`bin: skills`、ESM、TypeScript）、`tsconfig.json`、入口 `src/cli.ts`（commander）；构建方案初版 tsc，后迁移为 tsdown（单文件 bundle，commander 内联，tsc 仅负责 `--noEmit` 类型检查）
- [x] `src/core/checksum.ts`：单文件与目录级哈希计算（目录哈希按排序后的「相对路径 + 内容」归一化，排除顺序干扰；忽略 `.DS_Store`）
- [x] `src/core/scanner.ts`：扫描 `rules/` 产出「分类 → skills 清单」，解析 `SKILL.md` frontmatter 取 name/description（`src/core/frontmatter.ts` 极简解析器）
- [x] `src/core/config.ts`：`skills.config.json` 读写与 schema 校验（`categories` / `tools` / `exclude`，另支持可选 `source` 覆盖源仓库，便于本地开发与私有部署）
- [x] `src/core/registry.ts`：manifest 读写（已装清单、安装时 checksum、目标工具、installedAt）
- [x] 缓存管理：`ensureCache()`——`~/.skills/repo` 不存在则 clone，存在则 `set-url` + `pull --ff-only`；`source` 为本地目录时直接使用不落缓存
- [x] `install` 命令（非交互路径）：读配置 → 展开分类（含 exclude、分类不存在报错列出可选项）→ 按映射复制到各工具目录 → 写 manifest
- [x] 复制时处理 skill 内的 `agents/` 子目录：Codex / Claude Code 随目录原样复制（含 `references/`）；Cursor / Trae 压平为单文件时自然丢弃（`src/core/mapping.ts`）
- [x] manifest 存放位置定案：`.skills/manifest.json`，无绝对路径；幂等重装时内容未变则保留 installedAt，manifest 字节级稳定

**验收标准**

- 在一个测试项目中，写好 `skills.config.json` 后执行 install，四个工具目录产物正确 ✅（11 个 skill，exclude 1 个，装 10 个 × 4 工具）
- manifest 记录每个已装 skill 的安装时 checksum ✅（源 skill 目录级 SHA-256）
- 重复执行 install 幂等，不产生脏数据 ✅（二次执行 manifest md5 一致；dir 模型先 rm 再 cp，无残留旧文件）

---

## 阶段 3：交互式 install + list（P2 · 首次体验）✅ 已完成

**目标**：无配置的新项目一条命令完成安装，这是日常使用的主入口。

**任务**

- [x] 交互式问答：多选分类（`common`/`frontend` 默认勾选；`vue`/`react` 等选型分类作为独立问题，可检测 `package.json` 依赖作推荐）→ 多选工具（检测项目内已存在的 `.agents`/`.claude`/`.cursor`/`.trae` 目录作默认选中，无任何标记时全选）——零依赖自研 raw-mode 问卷组件（`src/core/prompt.ts`：↑↓ 移动、空格勾选、a 全选/清空、回车确认、Ctrl-C 退出）
- [x] 问答结果生成并写入 `skills.config.json`，随后走 install 流程（非 TTY 环境无配置时给出含示例的友好报错）
- [x] `list` 命令：列出缓存源中所有 skills（名称、分类、描述）
- [x] `list --installed`：对照 manifest 显示项目已装及其状态（是否有更新、是否本地改动、副本缺失、源已删除）
- [x] install 完成后输出 `.gitignore` 建议提示（按所选工具列出具体目录 + manifest 纳入版本控制）

**验收标准**

- 全新项目零配置，一条交互命令完成安装 ✅（pty 实测：三问 → 生成配置 → 8 skill × 4 工具）
- `list` 与 `list --installed` 输出信息准确 ✅

---

## 阶段 4：update 漂移检测（P2 · 核心价值）✅ 已完成

**目标**：实现复制模式下的安全更新，这是方案的核心卖点。

**任务**

- [x] `update` 命令：pull 缓存 → 读 manifest → 逐 skill 三态比对（源当前 / 本地副本 / 安装时记录）
- [x] 实现决策表（另补两行：本地缺失 → 修复恢复；冲突以非零码退出便于 CI 感知）：

| 本地副本 vs 安装时 | 源 vs 安装时 | 动作                            |
| ------------------ | ------------ | ------------------------------- |
| 一致（未改动）     | 有更新       | 覆盖，更新 manifest             |
| 不一致（被改过）   | 有更新       | 跳过 + 警告，`--force` 可强覆盖 |
| 一致               | 无变化       | 跳过                            |
| —                  | 源已删除     | 交互提示是否清理                |

- [x] 配置中新勾选但未安装的 skill 在 update 时补装
- [x] 汇总输出：更新数 / 跳过数 / 冲突数（另含补装 / 修复 / 清理）

**实现要点（补充定案）**

- 本地改动检测：dir 模型（Codex/Claude）直接 `hashDir(本地目录) vs manifest.checksum`（安装为整目录复制，天然可比）；flat 模型（Cursor/Trae）在 manifest 新增 `fileChecksums` 记录落盘文件内容哈希（旧 manifest 无此字段时视为未修改，交由源侧比对决策）
- update 覆盖或补装时保留 `installedAt`（首次安装时间语义）；manifest 仅在内容变化时写入

**验收标准**

- 本地未改 → 源更新后执行 update，副本被安全覆盖 ✅
- 本地有修改 → update 不覆盖且有明确警告 ✅（dir / flat 两种模型均实测）
- 源删除的 skill 有清理提示 ✅（交互确认清理 / 非交互保留并给出 remove 指引）
- `--force` 可强制覆盖（覆盖前打印将丢弃的文件）✅

---

## 阶段 5：remove + 收尾打磨（P3）✅ 已完成

**任务**

- [x] `remove` 命令：按 manifest 卸载对应目录，支持 `remove <skill-name>...` 多删与 `remove --all` 全删（交互环境全删前确认；无参数时交互式多选），清理 manifest（清空后连 manifest 与空目录链一并剪枝）
- [x] `agents/*.yaml` per-agent 适配策略完整落地（依阶段 1 结论）：Codex 随目录复制原生生效、Claude 忽略无副作用、Cursor/Trae 压平丢弃——阶段 2 已实现，本阶段复核确认
- [x] 错误信息友好化：缓存 clone 失败、网络问题、配置 schema 错误（阶段 2 已备），本阶段补齐 manifest 损坏、remove 未知名、非交互无配置、update/remove 前未 install 等场景
- [x] `--help` 与各子命令帮助文档（含示例块）
- [x] 处理边界：skill 目录名冲突（不同分类同名 skill → 警告并保留首个）、配置引用了不存在的分类（报错列出可用分类，阶段 2 已备）

**验收标准**

- remove 后目录与 manifest 干净，不留残余 ✅（`--all` 后仅剩 skills.config.json，空目录链被剪枝）
- 常见错误场景有可读的报错指引 ✅

---

## 阶段 6：发布与文档（P3 · 收官）✅ 已完成

**任务**

- [x] 定 npm 包名与发布渠道：包名 `skills-cli`（package.json bin: `skills`），渠道 public npm；实际 `npm publish` 需在有 npm 凭据的终端执行（唯一剩余手动步骤）
- [x] 验证 `npx <pkg> install` 全流程可用 ✅（`npm pack` → `npm exec --package=<tarball> -- skills install` 实测：按配置装 4 skill × 2 工具、manifest 正确）
- [x] 更新仓库 README：安装、配置格式、命令说明、目录结构、update 决策表、团队协作建议、版本策略
- [x] 版本号策略：semver，破坏性配置/manifest 结构变更升 major（README 已载明；当前 0.2.0）

**验收标准**

- 团队成员在他人的项目里 `npx` 一条命令完成安装 ✅（tarball 实测通过，发布后即 `npx skills-cli install`）
- README 足以让新成员无引导上手 ✅

---

## 遗留待定项（实施中择机定案）

| 事项                                    | 说明                                                                                                                        | 建议定案时机      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| ~~Cursor `.mdc` 转换~~                  | ✅ 已定案（阶段 1）：必须 `.mdc`，Trae 为 `.md`，两者均需压平转换，规则见附录 A                                             | 阶段 1            |
| ~~`agents/openai.yaml` 分发~~           | ✅ 已定案（阶段 1）：Codex 原生读取，随 skill 目录复制；Claude Code 忽略无副作用；Cursor/Trae 转换时丢弃                    | 阶段 1            |
| ~~`references/` 在 Cursor/Trae 的分发~~ | ✅ 已定案（阶段 2）：按附录 A 要点 3 实现——仅分发 `SKILL.md` 正文，`references/` 不随发；后续实测规则质量受损再评估内联合并 | 阶段 2 实现时复核 |
| ~~manifest 路径~~                       | ✅ 已定案（阶段 2）：`.skills/manifest.json`，无绝对路径，幂等重装字节级稳定，进版本控制                                    | 阶段 2            |
| ~~flat 工具本地改动检测~~               | ✅ 已定案（阶段 4）：manifest 条目新增 `fileChecksums`（Cursor/Trae 落盘文件内容哈希），与 dir 模型 `hashDir` 比对共同覆盖  | 阶段 4            |
| monorepo 子项目级配置                   | 现按项目根级设计，子项目需求出现时再扩展                                                                                    | 观望              |
| ~~npm 包名与渠道~~                      | ✅ 已定案（阶段 6）：`skills-cli`，public npm；`npm publish` 待有凭据时执行                                                 | 阶段 6            |

---

## 附录 A：工具映射表（阶段 1 实测定稿，2026-08-21）

| 工具        | 目标目录（项目级）         | 格式要求                                                                                                       | 转换规则                                                                                                                | 实测状态                                                                                                        |
| ----------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Codex       | `.agents/skills/<name>/`   | `SKILL.md`，frontmatter 必含 `name`、`description`；`references/`、`scripts/`、`agents/openai.yaml` 均原生支持 | **零转换**：skill 目录原样复制                                                                                          | ✅ `codex debug prompt-input` 确认注入模型输入（`.codex/skills/` 亦生效，定案取官方文档口径 `.agents/skills/`） |
| Claude Code | `.claude/skills/<name>/`   | `SKILL.md`（大小写敏感），`description` 必填，目录名 kebab-case                                                | **零转换**：skill 目录原样复制                                                                                          | ✅ 官方 CLI `claude plugin validate` 通过（v2.1.238）                                                           |
| Cursor      | `.cursor/rules/<name>.mdc` | **必须 `.mdc`**（`.md` 被忽略）；frontmatter：`description` / `globs` / `alwaysApply`                          | **需转换**：压平为单文件；`name` 丢弃（文件名承载），`description` 保留，`alwaysApply: false` 且不设 `globs` = 智能生效 | ✅ 官方文档确认格式，已按格式放置验证样本                                                                       |
| Trae        | `.trae/rules/<name>.md`    | `.md` 文件 + frontmatter（`alwaysApply` / `globs` / `description`，语义同 Cursor）；支持 ≤3 层子目录嵌套       | **需转换**：同 Cursor，扩展名为 `.md`                                                                                   | ✅ 官方文档确认格式，已按格式放置验证样本                                                                       |

### 复制层设计要点（供阶段 2 实现）

1. **两类目标模型**：Codex / Claude Code 是「skill 目录」模型，整目录复制（含 `references/`、`agents/`）；Cursor / Trae 是「单文件规则」模型，每个 skill 压平为一个文件。
2. **frontmatter 映射**（Cursor/Trae）：`description` 直传；`alwaysApply: false`；`globs` 默认不设（智能生效，语义上最接近 skill 的按需加载）。个别规则型 skill 若希望「始终生效」可后续经 frontmatter 扩展字段声明。
3. **`references/` 分发（Cursor/Trae）**：单文件模型无法按目录携带。首版建议：仅分发 `SKILL.md` 正文，`references/` 不随发（manifest 记录）；若实测发现规则质量受损，再评估内联合并或目录分发方案。
4. **`agents/openai.yaml`**：实测 Codex 原生读取（含 `comment-rules` 带 yaml 样本验证通过），装 Codex 时随目录复制零成本生效；Claude Code 忽略该文件无副作用；Cursor/Trae 压平转换时自然丢弃。**定案：保留现状，不分发逻辑特判。**
5. **`.gitignore` 策略**（✅ 已统一）：本仓库 `.gitignore` 已忽略全部工具目录（`.agents`、`.claude`、`.cursor`、`.trae`、`.codex`），阶段 1 验证产物仅以未跟踪状态保留在仓库根作映射活样本；CLI 侧则在 install 完成后按所选工具输出目标项目的 `.gitignore` 建议并提示 manifest 纳入版本控制。

### 验证产物（保留于仓库根，作为映射活样本）

```
.agents/skills/git-commit/SKILL.md      # Codex
.claude/skills/git-commit/SKILL.md      # Claude Code
.cursor/rules/git-commit.mdc            # Cursor（转换后格式）
.trae/rules/git-commit.md               # Trae（转换后格式）
```

---

## 附录 B：分类治理原则（平铺多分类模型）

### 模型定义

分类目录只有一层，目录名即能力维度，各维度正交、可组合。项目按自身情况在 `skills.config.json` 的 `categories` 数组中组合勾选（如 Vue 项目：`["common", "frontend", "vue"]`；React 项目：`["common", "frontend", "react"]`；Node 服务：`["common", "backend"]`）。

| 分类             | 维度                 | 归入标准                                              | 现有内容                                                                                                     |
| ---------------- | -------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `common/`        | 技术无关             | 换掉语言/框架/运行时，规则仍然成立                    | git-commit、file-naming、comment-rules、logic-comment-rules、requirement-first-implementation、monorepo-deps |
| `frontend/`      | 前端领域 · 选型无关  | 绑定前端领域，但不绑定具体框架（样式、TS 模块规范等） | scss-nesting、import-rules、export-rules                                                                     |
| `vue/`、`react/` | 框架选型（互斥平级） | 离开该选型规则就没有意义                              | vue/ 含 vue3-vue-file-template、vue-page-structure；react/ 占位                                              |
| `backend/`       | 后端领域 · 选型无关  | 绑定后端领域，不绑定具体框架                          | 占位                                                                                                         |
| `business-*/`    | 业务域（按需）       | 绑定特定业务域的规则                                  | 暂无                                                                                                         |

> 判例：TS 模块规范类规则（import/export）归 `frontend/` 而非 `common/`——`common/` 必须保持「换任何技术栈仍成立」的纯净度（Go/Python 项目勾选 common 不应装进 TS 规则），且别名（`@/* → src/*`）、API 导入风格依赖前端工程化配置。若未来出现 Node TS 后端消费需求，平级新增 `typescript/` 分类承接。

### 归类判定链（新增 skill 时自上而下，首问命中即停）

1. 换掉任何技术还成立 → `common/`
2. 绑定前端但不绑定框架 → `frontend/`
3. 离开某选型无意义 → 该选型目录（`vue/`、`react/`…）
4. 跨多个选型或绑定业务域 → 拆分 / 上浮 / `business-*/`

### 硬性约束

1. **目录名 = `skills.config.json` 的 categories 值 = 交互式勾选项**，三者永远一致，kebab-case
2. **互斥归档**：一个 skill 只属于一个分类；跨界的拆分或上浮，禁止一 skill 多档
3. **分类目录永远一层**，不做嵌套子分类
4. 新选型（如 `uniapp/`、`node/`、`rust/`）出现时平级新增目录，不动现有结构
5. 演进预留：若未来确需一 skill 多维度，通过 frontmatter 增加 `tags` 字段向后兼容，而不是推翻目录约定
