# S1-L01 随堂题

这些题用于理解检查，不是正式阶段考试。本次只需先回答C1–C3；其余用于练习与复习。每题写出结论、依据和你会补查的证据，不要求长篇。

## C1：这个结果该在哪一层处理？

输入：“登录按钮点击后没有反应。”

接口HTTP 200，返回：

~~~json
{
  "category": "feature",
  "priority": "medium",
  "summary": "新增登录按钮动画",
  "missingInformation": []
}
~~~

字段都符合课程契约。请说明哪些检查已经通过、哪里仍有问题，以及改写TypeScript类型能否解决这个问题。

## C2：没有解析错误就能显示吗？

模型返回：

~~~json
{"category":"question","priority":"low","summary":"   ","missingInformation":[]}
~~~

JSON.parse成功。你会让页面显示“分诊完成”吗？指出一个可以由程序确定检查的规则。

## C3：as到底改变了什么？

~~~ts
type Reading = { value: number };
const result = JSON.parse('{"value":"8"}') as Reading;
~~~

运行时result.value是什么类型？是编译器、JSON.parse还是其他程序负责保证它是数字？说明理由。

## C4：合法JSON的边界

分别解释以下文本被JSON.parse后得到什么，以及能否直接当作工单分诊对象使用：

~~~text
null
[]
"done"
42
{"category":"bug"}
~~~

## C5：你会怎样要求AI改代码？

AI提出：“用JSON.parse加as就够了，只要不抛异常就返回成功。”

请你写一段给AI的修正要求：包含任务边界、需要覆盖的失败类型和验证证据。不要直接粘贴完整实现。

## 实验记录

运行npm run lesson:01，记录：

1. 哪个输出与你原先预期不同？
2. 什么由运行结果直接证明？
3. 什么仍需要真实模型或业务规则验证？

## 答题位置

先在聊天回答C1–C3。需要保存个人答案时使用被忽略的learning/private/目录；通用讲评由老师匿名整理为公开课程补充。正式阶段提交仍按第一阶段提交模板执行。
