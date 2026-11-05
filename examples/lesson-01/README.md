# 第一课离线实验

运行npm run lesson:01；需要选择本机已有Node 24时，用powershell -NoProfile -File scripts/run.ps1 lesson:01。

预期观察：

- assertion.runtimeType为string；numericMethodError为TypeError。
- jsonSyntax.runtimeType为string，尽管JSON.parse已经成功。
- localResponse为503且ok为false；这是构造Response的本地实验，没有请求远程服务。
- fixture收到暗色模式需求，仍返回固定的订单故障结果；说明Mock不能证明业务分类效果。

代码故意使用一次不可信的类型断言来演示边界。异常已捕获，不修改当前阶段核心作业，也不调用模型服务。理解后按随堂题解释结果，不把脚本运行成功当作掌握证明。
