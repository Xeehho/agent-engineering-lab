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

## 完整应用工程课程来源，2026-11-05核对

正文与实验是本项目围绕合成工单场景编写的教学材料；下列资料用于核对机制与边界，没有复制整篇课程或将第三方案例作为学习者经历。

- [OpenAI 工具调用](https://developers.openai.com/api/docs/guides/function-calling)：调用提议、应用执行与结果关联。
- [OpenAI 结构化输出](https://developers.openai.com/api/docs/guides/structured-outputs)：结构约束和拒答/未完成等服务边界。
- [OpenAI Prompt 工程](https://developers.openai.com/api/docs/guides/prompt-engineering)：任务描述、示例与版本对照。
- [OpenAI 评测实践](https://developers.openai.com/api/docs/guides/evaluation-best-practices)：可重复评估的原则；课程采用本地可导出格式，不依赖某个托管 Evals 产品的生命周期。
- [Anthropic Agent 与 Workflow](https://www.anthropic.com/research/building-effective-agents)：作为架构划分参考，文中工具生态已有变化，不直接当作当前 SDK 选型结论。
- [MCP 架构 2026-07-28](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)、[同版安全实践](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices)：固定修订，真实实现再次核对 SDK。
- [Python 官方教程](https://docs.python.org/3/tutorial/)、[FastAPI async](https://fastapi.tiangolo.com/async/)：语言与异步桥接。
- [PostgreSQL 事务隔离](https://www.postgresql.org/docs/current/transaction-iso.html)、[索引](https://www.postgresql.org/docs/current/indexes.html)、[参数化预备语句](https://www.postgresql.org/docs/current/sql-prepare.html)：数据库实际行为需用所选版本实测。
- [Sentence Transformers 检索与重排](https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html)：检索管线参考。
- [OpenTelemetry Trace](https://opentelemetry.io/docs/concepts/signals/traces/)、[Docker 构建实践](https://docs.docker.com/build/building/best-practices/)：观测与交付基础。
- [OWASP LLM 应用风险](https://owasp.org/projects/top-10-for-large-language-model-applications)：安全威胁参考，不等于本项目已完成安全认证。
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1)：模型机制的后续深化入口。

## S1-L01补充来源，2026-11-05核查

- [TypeScript类型断言](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)：不执行运行时校验。
- [JSON Schema入门](https://json-schema.org/learn/getting-started-step-by-step)：结构与约束及validator的关系。
- [Claude结构化输出](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)：结构约束与拒答、未完成等异常边界。作为一家服务的例子，不代表所有服务协议相同。
