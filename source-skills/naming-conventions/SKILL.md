---
name: naming-conventions
description: 规范项目的文件和目录命名，以及 JavaScript 和 TypeScript 的常量、变量、函数和类型命名。在创建、重命名或审查这些名称时使用，按名称的用途选择命名法，遵循项目、工具和框架的命名约定。
---

# 命名规范

按实际用途选择规则。`MAX_RETRY_COUNT` 是固定业务上限，`retryCount` 即使用 `const` 声明也仍是运行时变量。路径与标识符分别判断，例如 `user-profile.vue` 中的 `UserProfile`。

按名称查阅对应规则。

- 固定配置、业务上限或协议值默认用 `UPPER_SNAKE_CASE`。[常量](references/constants.md)
- 数据绑定、参数、状态和自定义字段默认用 `camelCase`。[变量](references/variables.md)
- 普通函数和方法默认用 `camelCase`。[函数、事件处理和框架约定](references/functions.md)
- 类型别名和接口默认用 `PascalCase`。[类型及泛型参数](references/types.md)
- 可自主命名的文件和目录默认用 `kebab-case`。[路径规则及例外](references/files-and-directories.md)

新增名称前检查所在目录或模块的明确规则。工具和框架识别的名称、接口字段、公开 API 和用户指定的名称遵循各自约定。普通编辑沿用既有名称，审查按任务范围报告问题及建议。重命名时检查冲突、更新引用，并按项目约定处理依赖旧名称的公开契约。
