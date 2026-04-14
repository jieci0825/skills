# Skills

> 具备强烈个人风格的 skills

如果你是第一次打开这个仓库，下面几点会让你有个初步的了解：

1. `standards/` 放的是日常编码规范，主要覆盖 Vue 3、TypeScript、SCSS 和 Git 提交。
2. `workflow/` 放的是从“模糊需求”走到 “MVP 方案”的推进流程。
3. 每个 skill 都尽量只解决一个具体问题，按需使用。

## 目录一览

```text
skills/
├── standards/
│   ├── file-naming
│   ├── export-rules
│   ├── git-commit
│   ├── import-rules
│   ├── scss-nesting
│   ├── vue-page-structure
│   └── vue3-vue-file-template
└── workflow/
    ├── complexity-evaluation
    ├── requirement-clarification
    └── solution-to-mvp
```

可以先把它理解成两层：

- `standards` 解决“怎么写”
- `workflow` 解决“怎么推进”

## 推荐阅读顺序

### 1. 先建立最小共识

如果你只是想快速知道这套规则在约束什么，优先看这 3 个：

- `standards/file-naming`：统一文件命名，默认使用 `kebab-case`
- `standards/import-rules`：统一导入方式、路径别名、类型导入和排序
- `standards/export-rules`：统一导出风格，默认命名导出优先

这三项看完，已经能覆盖大部分“代码风格不一致”的问题。

### 2. 写页面或组件时再往下看

当你开始新建页面、拆组件或者补样式时，再继续看：

- `standards/vue3-vue-file-template`：新建 Vue 单文件组件时的基础模板
- `standards/vue-page-structure`：页面目录怎么拆、`index.vue` 应该承担什么职责
- `standards/scss-nesting`：样式嵌套怎么写，顶层类名怎么控制

这一组更偏“落地写法”，适合开发阶段边看边用。

### 3. 需求还不够清晰时，再进入 workflow

如果问题不在代码，而在“这事到底该怎么做”，就看 `workflow/`：

- `workflow/requirement-clarification`：先把模糊诉求收束成可执行需求
- `workflow/complexity-evaluation`：判断这件事是简单、中复杂还是高复杂
- `workflow/solution-to-mvp`：在前两步基础上收敛方案、MVP 和后续迭代

这一组适合需求评审、方案讨论、任务拆解前使用。

## 每一类 skill 在做什么

<details>
<summary><strong>standards</strong>：日常编码规范</summary>

| Skill | 作用 |
| --- | --- |
| `file-naming` | 统一文件命名方式，避免出现大小写、下划线、短横线混用 |
| `vue3-vue-file-template` | 新建 `.vue` 文件时生成统一骨架，自动区分 TS / JS 项目 |
| `import-rules` | 统一别名路径、桶导入、类型导入分离和导入顺序 |
| `export-rules` | 统一命名导出、桶导出、类型导出和导出顺序 |
| `vue-page-structure` | 约束页面目录结构，强调容器组件与展示组件分离 |
| `scss-nesting` | 统一样式嵌套方式，减少选择器平铺和样式分散 |
| `git-commit` | 按 Conventional Commits 生成中文提交信息 |

</details>

<details>
<summary><strong>workflow</strong>：需求到方案的推进流程</summary>

| Skill | 作用 |
| --- | --- |
| `requirement-clarification` | 先把问题说清楚，再进入设计和实现 |
| `complexity-evaluation` | 判断任务复杂度，决定该一次说完还是分阶段推进 |
| `solution-to-mvp` | 输出候选方案、最终方案、MVP 范围和迭代路线 |

</details>