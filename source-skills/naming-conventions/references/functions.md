# 函数命名

- 普通函数和方法使用 `camelCase`，用动词和对象说明行为，例如 `fetchUser`、`formatDate`、`deleteOrder`。以函数表达式或箭头函数赋值时，对绑定使用相同规则。
- 返回布尔值的函数用与语义匹配的谓词，例如 `isValidEmail`、`hasPermission`、`canEditOrder`、`shouldRetry`。
- 项目可以用 `handleSubmit` 表示内部事件处理函数，用 `onSubmit` 表示传入的事件回调。已有框架或接口定义回调名称时，沿用其名称。
- 组件或 Hook 按框架约定命名，例如采用 PascalCase 的 `UserProfile` 组件，以及采用 `use` 前缀的 `useUserProfile` Hook。组件文件名按文件与目录规则单独判断。
