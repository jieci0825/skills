---
name: logic-comment-rules
description: 规范所有编程语言中较长或复杂函数的内部逻辑注释。在新增、修改或重构包含多个执行阶段、分支、循环、重试、异常处理、状态变化或关键业务规则的函数时自动应用：为关键执行阶段添加简洁注释，说明该阶段的目的和原因；禁止逐行翻译代码、注释显而易见的语句或给简单函数强行添加逻辑注释。
---

# Logic Comment Rules

## 核心原则

为较长或复杂函数的关键执行阶段添加逻辑注释，帮助读者快速理解函数的执行流程、业务意图和重要决策。

保持注释简单、准确、克制。注释用于降低理解成本，不用于重复代码已经清楚表达的信息。

本规范约束函数内部的逻辑注释。函数声明前的文档注释继续遵循 `comment-rules`。

## 判断是否需要逻辑注释

当本次新增、修改或重构的函数存在以下一种或多种情况时，添加逻辑注释：

- 包含多个具有独立目的的执行阶段。
- 包含较长的条件分支、循环或嵌套控制流。
- 包含重试、降级、补偿、回滚或提前终止逻辑。
- 包含不容易从代码本身看出的业务规则或边界条件。
- 包含关键状态变化、数据转换或跨模块调用。
- 包含需要区分处理方式的异常流程。

以下情况通常不添加逻辑注释：

- 函数短小，名称、类型和代码已经能够清楚表达行为。
- 只有简单赋值、直接返回或单一 API 调用。
- 注释只能逐字翻译下一行代码。

不要使用固定行数作为唯一判断标准。根据控制流和业务理解成本判断函数是否复杂。

## 编写规则

1. 在一个关键执行阶段开始前添加注释。
2. 说明这一阶段“为什么做”或“要完成什么”，不要复述具体语法。
3. 每个阶段通常使用一条简短注释；只有复杂约束确实需要解释时才使用多行注释。
4. 使用与代码库一致的自然语言和注释语法。
5. 让注释紧邻对应代码，避免读者判断注释属于哪个逻辑块。
6. 代码变化后同步更新注释，禁止保留与实际行为不一致的说明。
7. 只为本次触碰的复杂函数补充必要注释，不批量修改无关历史代码。

## 注释重点

优先解释以下内容：

- 初始化数据是为了支持后续哪个流程。
- 分支或提前返回对应什么业务条件。
- 循环每次迭代承担什么阶段性任务。
- 为什么允许重试，以及什么情况会终止重试。
- 异常为何需要转换、记录、忽略或继续抛出。
- 某个看似多余的步骤用于满足什么约束。

避免以下内容：

- “定义变量”“调用方法”“返回结果”等代码直译。
- 对每一行或每一个简单判断都添加注释。
- 使用“处理数据”“执行逻辑”等没有具体信息的表述。
- 在注释中描述代码尚未实现的未来能力。
- 用大段注释掩盖过度复杂的函数；如果代码本身明显过度复杂，先简化代码。

## 工作流程

处理函数时按以下顺序执行：

1. 阅读完整函数，识别输入、输出、主要控制流和异常路径。
2. 判断代码本身能否直接表达逻辑；能表达时不添加多余注释。
3. 将复杂流程划分为少量关键执行阶段。
4. 仅在各阶段入口添加说明目的或原因的注释。
5. 复查注释是否准确、必要，删除逐行解释和重复信息。

## Good

以下示例按关键阶段说明流程，没有对每行代码进行翻译：

```ts
/**
 * 调用 LLM 生成查询转换结果，并针对 Zod 校验问题最多定向修复两次。
 */
async function generateQueryTransform(
    query: string,
    model: string,
    llmProvider: LlmProvider
): Promise<QueryTransformOutput> {
    // 构建首次请求所需的上下文，后续校验失败时会在此基础上追加修复信息。
    const messages: LlmMessage[] = [
        { role: 'system', content: QUERY_TRANSFORM_SYSTEM_PROMPT },
        { role: 'user', content: query },
    ]

    // 在限定次数内生成并校验结果，只有结构校验失败时才请求 LLM 定向修复。
    for (let attempt = 1; attempt <= MAX_QUERY_TRANSFORM_ATTEMPTS; attempt += 1) {
        let output: unknown

        try {
            output = await llmProvider.generateStructuredOutput(model, {
                messages: [...messages],
                format: QUERY_TRANSFORM_FORMAT,
            })
        } catch (error) {
            // LLM 请求错误不具备定向修复条件，记录上下文后直接终止。
            log('error', 'Query transform LLM request failed', {
                model,
                attempt,
                err: error,
            })
            throw new AppError(ERROR_DEFINITIONS.QUERY_TRANSFORM_FAILED)
        }

        const validationResult = queryTransformOutputSchema.safeParse(output)

        if (validationResult.success) {
            return validationResult.data
        }

        const retriesRemaining = MAX_QUERY_TRANSFORM_ATTEMPTS - attempt

        if (retriesRemaining === 0) {
            throw new AppError(ERROR_DEFINITIONS.QUERY_TRANSFORM_FAILED)
        }

        // 将错误输出和具体校验问题加入上下文，引导下一次请求只修复结构问题。
        messages.push(
            { role: 'assistant', content: JSON.stringify(output) },
            {
                role: 'user',
                content: JSON.stringify(validationResult.error.issues),
            }
        )
    }

    throw new AppError(ERROR_DEFINITIONS.QUERY_TRANSFORM_FAILED)
}
```

Good 注释的特点：

- 标明初始化、重试、异常终止和定向修复等关键阶段。
- 解释“为什么直接终止”和“为什么追加消息”。
- 不注释 `safeParse`、变量赋值和返回等直观代码。

## Bad

以下示例逐行翻译代码，增加了阅读噪音：

```ts
// 定义消息数组
const messages = []

// 开始循环
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    // 定义输出变量
    let output

    try {
        // 调用 LLM
        output = await generate()
    } catch (error) {
        // 抛出错误
        throw error
    }

    // 校验输出
    const result = schema.safeParse(output)

    // 判断是否成功
    if (result.success) {
        // 返回数据
        return result.data
    }
}
```

以下注释过于空泛，没有帮助读者理解业务意图：

```ts
// 处理数据
const normalizedRecords = normalizeRecords(records)

// 执行业务逻辑
await persistRecords(normalizedRecords)
```

应直接删除这些注释；如果流程确有非显而易见的目的，应准确说明约束或原因。
