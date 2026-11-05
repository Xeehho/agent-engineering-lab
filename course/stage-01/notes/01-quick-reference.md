# S1-L01 速记｜模型请求的成功边界

配套：[完整讲义](../lessons/01-success-contracts.md) · [随堂题](../exercises/01-checkpoint.md)

## 五个需要分开记住的判断

|判断|检查对象|
|---|---|
|HTTP／SDK调用是否正常|响应、状态、错误、完成／拒答状态|
|JSON语法能否解析|文本是否是完整合法JSON|
|数据是否符合契约|对象、字段、类型、枚举、长度与数量|
|内容是否符合任务|与输入一致、规则明确、结论有依据|
|验证能支持多大范围|单个样例、Mock、真实模型或真实使用分别记录|

后三个检查不能由HTTP 200自动推出。

## 常用概念

- JSON.parse：解析语法，不验证你的业务对象。
- as：类型断言，不会把字符串变成数字，也不执行运行时校验。
- unknown：先不假设外部数据的结构，再验证和缩小类型。
- Schema：描述数据结构与约束；validator负责执行检查。
- Prompt：表达任务与约定。
- 结构化输出：服务在支持范围内约束结构；仍要处理异常与业务正确性。
- Mock：人为固定或模拟的响应，用于工程验证；不能证明模型理解了输入。

类型断言行为见[TypeScript官方说明](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)；Fetch状态处理见[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)。

## 失败分类速查

- 无法解析JSON：语法或完整性问题，并追查上游完成状态。
- 未知枚举／字段缺失／空白摘要：数据契约问题。
- 字段合法但内容答错：业务问题。
- 规则根本没定义：先补业务规则，再谈正确率。

## 代码审查四问

1. 此处数据来自哪里？
2. 这个类型由什么实际检查支撑？
3. 无效结果在哪一层被拒绝？
4. 我亲自验证的结果，能支持多大范围的结论？

## 本课实验

npm run lesson:01；Windows可用scripts/run.ps1 lesson:01。

实验固定输出不构成真实模型测试，不计为学习者已经完成阶段作业。
