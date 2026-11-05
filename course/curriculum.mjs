import foundation from "./content/stage-01.mjs";
import tools from "./content/stage-02.mjs";
import mcp from "./content/stage-03.mjs";
import workflow from "./content/stage-04.mjs";
import rag from "./content/stage-05.mjs";
import collaboration from "./content/stage-06.mjs";
import production from "./content/stage-07.mjs";
import graduation from "./content/stage-08.mjs";
import { experiments, checkpoints, quiz } from "../classroom/content.mjs";

export const stages = [
  { id:"01", title:"模型应用基础", prerequisites:"能阅读 JavaScript / TypeScript",
    deliverable:"可信工单分诊接口与 React 面板；Python 契约桥接和模型选择 ADR。",
    acceptance:["输入与输出分别验证，保持业务规则与结构校验分离","有限超时、取消、流式终态与晚到事件处理","公开练习与失败复盘可复现，Mock/真实验证分别记录","能读懂 Python 最小路由与异步边界，不要求重复语言入门"] },
  { id:"02", title:"工具调用与 Agent 循环", prerequisites:"01 的契约、取消和证据边界",
    deliverable:"能检索、读工单、生成草稿，并受预算与确认约束的有限 Agent。",
    acceptance:["已知工具白名单、参数/结果验证和调用关联","最大轮次、工具次数、总期限、取消和停滞处理","读取/草稿/写入权限分离，具体确认与持久幂等","未知工具、注入、重复写入和预算耗尽均有拒绝路径"] },
  { id:"03", title:"MCP 互操作与信任", prerequisites:"02 的工具契约与权限",
    deliverable:"一个真实可接入的本地 MCP Server 与 Client 演示。",
    acceptance:["协议修订、SDK 与运行环境明确","真实发现、调用、错误与取消可复现，网页模拟不计互通","身份与租户权限不来自模型参数","日志通道、返回上限、服务来源与凭证作用域可解释"] },
  { id:"04", title:"持久状态与任务工作台", prerequisites:"02/03 的执行和幂等边界",
    deliverable:"可刷新恢复、暂停确认、排队执行的持久任务系统。",
    acceptance:["request/task/attempt 关联和合法状态转换","真实数据库条件更新、重启恢复与队列重复交付","租约失效、陈旧 worker 与副作用恢复有设计/证据","React 多任务隔离、旧快照拒绝、明确取消/确认语义"] },
  { id:"05", title:"RAG 与知识数据工程", prerequisites:"01 的模型基础，03 的权限，04 的版本/状态",
    deliverable:"带权限、版本、逐主张引用和无答案策略的知识问答。",
    acceptance:["采集、清洗、切分、删除与索引血缘可追踪","关键词/向量/混合基线，模型与索引版本可复现","重排、来源支持、冲突/过期/无答案分别处理","检索/回答/引用/拒答分层评测，测试集与开发集隔离"] },
  { id:"06", title:"多 Agent 与架构取舍", prerequisites:"02 的有限循环，05 的证据包，07 评测可交叉学习",
    deliverable:"有基线对照的角色协作方案和保留/回退 ADR。",
    acceptance:["每个角色有可验收输入/输出与最小权限","交接携带来源、版本、未解决项和副作用状态","冲突回退与总预算有程序上限","单 Agent/Workflow/多 Agent 同集对照，失败、费用和延迟不漏算"] },
  { id:"07", title:"评测、观测与生产交付", prerequisites:"01–05 项目基础；可提前读评测与 trace",
    deliverable:"评测回归、脱敏 trace、容量/部署方案与真实模型证据。",
    acceptance:["固定分层样本、评分器校准、关键错误发布门槛","模型/工具/检索/状态可关联，usage 未知不填零","干净环境启动、迁移、限流、降级、回滚和故障演练","已授权真实 API 的互通/完成/契约/效果分别验证；无 Key 留 live_pending"] },
  { id:"08", title:"毕业项目与求职表达", prerequisites:"前序项目、真实接入与可复现证据",
    deliverable:"可演示工作台、架构与 ADR、项目简历段及模拟面试。",
    acceptance:["需求、实现、验证与演示逐项对应","本人解释关键路径并处理新需求与陌生故障","个人/课程经历真实标注，指标有样本/基线/环境","目标 JD 与能力证据映射，缺口补学，不承诺薪资或录用"] },
];
const first = {
  id:"S1-L01", stage:"01", title:"一次模型请求怎样才算成功",
  summary:"从拿到响应到可信结果：区分调用、数据契约与业务正确性。",
  duration:"25–40 分钟 + 随堂练习",
  goals:["区分三个成功边界","解释解析、类型断言与运行时校验","说明证据支持的范围"],
  experiments, checkpoints, quiz,
  project:"S1-T1/T2：先定义输入输出与失败预期，再协作实现；本课不提前完成整份作业。",
  lecturePath:"course/stage-01/lessons/01-success-contracts.md",
  notesPath:"course/stage-01/notes/01-quick-reference.md",
  checkpointPath:"course/stage-01/exercises/01-checkpoint.md",
  sources:[],
};
export const lessons = [first,...foundation,...tools,...mcp,...workflow,...rag,...collaboration,...production,...graduation]
  .map(item => ({...item,
    lecturePath:item.lecturePath || "course/stage-" + item.stage + "/lessons/" + item.id + ".md",
    notesPath:item.notesPath || "course/stage-" + item.stage + "/notes/" + item.id + ".md",
    checkpointPath:item.checkpointPath || "course/stage-" + item.stage + "/exercises/" + item.id + ".md",
  }));
