# 资料与课程取舍

岗位依据见career/目录，保留D/R/E/U标记。课程与习题是针对学习目标设计，不是公司真实考题。

工程选型查阅日期：2026-11-05。项目固定Node 24 LTS与依赖锁文件，使用实际验证版本。

- [Node发布状态](https://nodejs.org/en/about/previous-releases)
- [Vite启动说明](https://vite.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Node 24全局对象与AbortController](https://nodejs.org/docs/latest-v24.x/api/globals.html)
- [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MCP官方架构](https://modelcontextprotocol.io/docs/learn/architecture)
- [MCP官方SDK](https://modelcontextprotocol.io/docs/sdk)
- [LangGraph TypeScript](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [Promptfoo](https://www.promptfoo.dev/docs/intro/)
- [OpenTelemetry Traces](https://opentelemetry.io/docs/concepts/signals/traces/)

第一阶段使用直接HTTP与可注入provider，帮助观察边界。后续按真实需要选择库，框架名称不作为通关标准。

## S1-L01补充来源，2026-11-05核查

- [TypeScript类型断言](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)：不执行运行时校验。
- [JSON Schema入门](https://json-schema.org/learn/getting-started-step-by-step)：结构与约束及validator的关系。
- [Claude结构化输出](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)：结构约束与拒答、未完成等异常边界。作为一家服务的例子，不代表所有服务协议相同。
