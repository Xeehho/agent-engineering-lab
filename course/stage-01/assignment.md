# 第一阶段作业契约

## 已提供

React实验台、Node HTTP入口、共享TypeScript类型、Mock provider、6种故障情境和骨架检查。server/learning/中的核心函数尚未实现。此时501是“尚未完成作业”的明确状态。

## S1-T1 输入校验

POST /api/triage输入：

~~~json
{"text":"订单页面无法加载","scenario":"valid"}
~~~

要求：对象；text为去除前后空白后1–2000个字符的字符串；scenario可缺省，默认valid，只允许server/providers/types.ts中的枚举。非法输入抛LabError：code为VALIDATION_ERROR、status为400。不调用provider。

schema严格程度与多余字段策略由你决定，在提交文档中说明。恶意工单文本不能作为程序指令改变验证来源。

## S1-T2 调用与结构化输出

triageTicket(input, provider, options)调用注入的provider，不按scenario硬编码最终业务结果。Prompt由server/learning/prompt.ts定义并版本化。

模型文本需要解析与运行时校验：

|字段|约束|
|---|---|
|category|bug、feature、question之一|
|priority|low、medium、high之一|
|summary|非空字符串，去除空白后1–200字符|
|missingInformation|字符串数组，每项为非空字符串，最多10项|

模型JSON损坏、结构或上述字段语义约束错误：MODEL_OUTPUT_INVALID / 502。Mock“empty-summary”正是合法JSON但违反字段约束的例子；不是模型内容真实性评测。

成功输出使用shared/contracts.ts的TriageResponse。requestId沿用options；provider、model、promptVersion必须真实；Mock usage是null，不能编造Token统计。

## S1-T3 异常、超时与取消

|情况|code|status|
|---|---|---|
|输入非法|VALIDATION_ERROR|400|
|模型输出非法|MODEL_OUTPUT_INVALID|502|
|上游普通故障|MODEL_UPSTREAM_ERROR|502|
|内部超时|MODEL_TIMEOUT|504|
|调用方取消|REQUEST_CANCELLED|499|

499在本实验用作应用层分类约定；真实断开连接时不能保证客户端还收到HTTP响应。

遵守options.timeoutMs，并把取消传递给provider。调用前signal已取消时不得启动provider。清理定时器和监听器；不得依赖provider自己恰好在截止时间返回。对provider不遵守取消的情形，说明服务层能保证什么、不能保证什么。

## S1-T4 流式接口与React面板

实现POST /api/triage/stream，采用text/event-stream与SSE帧格式，通过fetch读取POST流；也可以解释并提交等价的事件传输设计。

事件契约：

- started：含requestId，每个已开始任务一次。
- completed：含同一requestId和通过校验的TriageResponse，作为终止事件。
- failed：含同一requestId和安全的错误信息，作为终止事件。
- 已发started后必须有且仅有一个终止事件；连接已断开则记录服务端终止证据，不强求向已断开的客户端发送。
- HTTP头发出前的输入错误按普通JSON错误响应；头发出后用事件表示错误。
- React展示事件记录、执行中、成功、失败、取消；取消按钮必须连接当前请求，不能只清空页面。
- 不把半个JSON或业务进度误当最终结构化结果。

公开11条练习只覆盖triageTicket；流式需要你追加集成验证，老师会另查。

## S1-T5 交付证据

按submissions/stage-01/README.md提交：

1. 数据流与错误流图。
2. 公开练习结果，以及3个新增边界用例。
3. 流式成功、失败、取消的实际记录。
4. 一份你亲自定位的错误复盘。
5. AI参与范围和你能独立解释的实现。
6. Mock与真实模型验证范围。

## S1-X1 真实模型加题

自行实现一个ModelProvider适配器，凭本机配置显式启用。默认仍为Mock，不让测试或CI调用收费服务。处理HTTP错误、用量缺失与模型格式差异。只允许连接你已获授权的服务，不把Key提交或贴进聊天。

未完成该加题时，可用离线证据参加阶段考试，但真实模型接入能力记为待验证。
