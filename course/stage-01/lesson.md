# 第一课：理解一次模型调用

这份讲义给你判断框架和实验方向，核心业务实现留在作业中。

## 1. 一次请求有三层正确性

1. **传输层**：HTTP是否收到响应、状态码是否正常。
2. **结构层**：文本能否解析成JSON，字段、类型、枚举是否符合契约。
3. **任务层**：结果是否忠于输入、缺信息是否明确、摘要是否可用。

三层需要分别验证。Mock返回固定文本，只能练习程序行为；判断模型是否真的理解工单需要真实输入集与真实模型实验。

## 2. TypeScript与外部数据

类型帮助你在开发时检查代码。模型返回、HTTP请求和JSON.parse产生的是运行时数据，不能仅靠类型断言获得可信性。边界处先按unknown处理，再决定哪些字段与约束需要检查。

实验：分别观察一个合法JSON对象、合法JSON字符串、字段缺失对象、未知枚举值和空白摘要。记录你定义的合约如何处理它们。

## 3. Prompt与程序各自负责什么

Prompt描述任务、输入范围、输出结构和无法判断时的处理。程序负责校验、错误分类、超时、取消、权限和状态。模型可能没有遵守Prompt，程序仍要有确定的处理路径。

练习时保存Prompt版本。修改后用同一组输入比较，不只看一个成功样例。

## 4. 超时与取消

先画清谁发起取消、谁收到信号、何时清理资源。仅让一个Promise先返回，不能据此认定其他工作结束。检查provider是否真的观察signal，并验证已经取消的调用是否仍被启动。

处理调用方取消与内部deadline时，明确错误优先级；不要把所有AbortError都归为同一原因。具体实现由你设计并用测试证明。

## 5. 流式事件

模型Token流、业务进度事件、最终结构化结果是不同对象。第一阶段使用业务事件协议，先稳定地传递started、completed或failed，再按需要扩展模型文本增量。

POST流可通过fetch消费ReadableStream。必须考虑响应头已发送后不能重新设置HTTP状态，以及用户停止读取后后端仍可能运行的情况。

## 6. AI Coding协作方法

每个任务做四件事：你先写预期 → AI参与实现 → 你追踪关键代码与失败路径 → 你亲自运行验证并记录范围。

向AI提问时，先要求它指出假设、输入输出和失败路径；验证失败后保留报错与原因。能够解释你接受的代码，比记住工具命令更有用。

## 官方参考

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)：类型与程序结构。
- [Node AbortController](https://nodejs.org/docs/latest-v24.x/api/globals.html#class-abortcontroller)：取消信号。
- [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)：响应与取消。
- [模型工具调用官方说明](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)：为下一阶段准备模型／工具分工。
- [AI SDK](https://ai-sdk.dev/docs/introduction)：可选参考，当前阶段先理解底层数据流。

不要在第一阶段同时引入多套Agent框架。你可以选常用库完成校验与流式实现，但需要说明它负责了什么。
