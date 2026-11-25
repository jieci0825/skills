---
name: naming-conventions
description: 规范项目的文件和目录命名，以及 JavaScript 和 TypeScript 的常量、变量、函数和类型命名。在创建、重命名或审查这些名称时使用，按名称的用途选择命名法，遵循项目、工具和框架的命名约定。
---

# 命名规范

按名称的实际用途选择规则。用于固定业务上限的 `MAX_RETRY_COUNT` 属于常量，保存运行时结果的 `retryCount` 即使用 `const` 声明也属于变量。文件路径与代码标识符分别判断，组件文件可以叫 `user-profile.vue`，代码中的组件名可以叫 `UserProfile`。

## 按需查阅

- 为固定配置、业务上限或协议值命名时，读 [常量命名](references/constants.md)，默认用 `UPPER_SNAKE_CASE`。
- 为数据绑定、参数、状态或项目自定义字段命名时，读 [变量命名](references/variables.md)，默认用 `camelCase`。
- 为函数、方法、事件处理函数或受框架约定的可调用实体命名时，读 [函数命名](references/functions.md)，普通函数默认用 `camelCase`。
- 为类型别名、接口或泛型参数命名时，读 [类型命名](references/types.md)，类型别名和接口默认用 `PascalCase`。
- 为项目路径命名或判断路径例外时，读 [文件与目录命名](references/files-and-directories.md)，可自由命名的部分默认用 `kebab-case`。

## 适用范围

- 新增名称时，先检查项目在对应目录或模块的明确规则，再对可自主命名的部分应用默认规则。工具和框架识别的名称、接口字段、公开 API 以及用户明确指定的名称，按各自的约定处理。
- 普通编辑沿用既有名称。命名审查按任务范围报告问题与建议。任务包含重命名时，检查与现有名称的冲突、同步更新引用，并按项目约定处理依赖旧名称的公开契约。
