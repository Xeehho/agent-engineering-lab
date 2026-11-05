// Generated from course/curriculum.mjs. Run npm run classroom:build.
export const courseOverview = {
  "stats": {
    "stages": 8,
    "lessons": 31,
    "experiments": 34,
    "checkpoints": 95,
    "quizzes": 96,
    "detailed": 31,
    "brief": 0
  },
  "stages": [
    {
      "id": "01",
      "title": "模型应用基础",
      "deliverable": "可信工单分诊接口与 React 面板；Python 契约桥接和模型选择 ADR。",
      "lessons": [
        {
          "id": "S1-L01",
          "title": "一次模型请求怎样才算成功",
          "contentLevel": "detailed"
        },
        {
          "id": "S1-L02",
          "title": "超时与取消：请求结束了吗？",
          "contentLevel": "detailed"
        },
        {
          "id": "S1-L03",
          "title": "流式事件与 React 状态",
          "contentLevel": "detailed"
        },
        {
          "id": "S1-L04",
          "title": "验证证据与第一阶段交卷",
          "contentLevel": "detailed"
        },
        {
          "id": "S1-L05",
          "title": "模型基础：Token、上下文与推理边界",
          "contentLevel": "detailed"
        },
        {
          "id": "S1-L06",
          "title": "Python 后端桥接：读懂服务边界",
          "contentLevel": "detailed"
        }
      ]
    },
    {
      "id": "02",
      "title": "工具调用与 Agent 循环",
      "deliverable": "能检索、读工单、生成草稿，并受预算与确认约束的有限 Agent。",
      "lessons": [
        {
          "id": "S2-L01",
          "title": "工具调用：模型提议，应用执行",
          "contentLevel": "detailed"
        },
        {
          "id": "S2-L02",
          "title": "有限 Agent 循环与预算",
          "contentLevel": "detailed"
        },
        {
          "id": "S2-L03",
          "title": "副作用、幂等与提示注入",
          "contentLevel": "detailed"
        },
        {
          "id": "S2-L04",
          "title": "Prompt 与上下文工程",
          "contentLevel": "detailed"
        }
      ]
    },
    {
      "id": "03",
      "title": "MCP 互操作与信任",
      "deliverable": "一个真实可接入的本地 MCP Server 与 Client 演示。",
      "lessons": [
        {
          "id": "S3-L01",
          "title": "MCP 的边界：Host、Client、Server",
          "contentLevel": "detailed"
        },
        {
          "id": "S3-L02",
          "title": "MCP 发现、传输与错误",
          "contentLevel": "detailed"
        },
        {
          "id": "S3-L03",
          "title": "MCP 权限与服务信任",
          "contentLevel": "detailed"
        }
      ]
    },
    {
      "id": "04",
      "title": "持久状态与任务工作台",
      "deliverable": "可刷新恢复、暂停确认、排队执行的持久任务系统。",
      "lessons": [
        {
          "id": "S4-L01",
          "title": "任务状态与持久化",
          "contentLevel": "detailed"
        },
        {
          "id": "S4-L02",
          "title": "队列、重试、租约与幂等",
          "contentLevel": "detailed"
        },
        {
          "id": "S4-L03",
          "title": "人工确认与前端任务工作台",
          "contentLevel": "detailed"
        },
        {
          "id": "S4-L04",
          "title": "SQL、索引与事务：存储工程基础",
          "contentLevel": "detailed"
        }
      ]
    },
    {
      "id": "05",
      "title": "RAG 与知识数据工程",
      "deliverable": "带权限、版本、逐主张引用和无答案策略的知识问答。",
      "lessons": [
        {
          "id": "S5-L01",
          "title": "RAG 数据入口：切分、版本与权限",
          "contentLevel": "detailed"
        },
        {
          "id": "S5-L02",
          "title": "Embedding、向量与混合检索",
          "contentLevel": "detailed"
        },
        {
          "id": "S5-L03",
          "title": "重排、引用与拒答",
          "contentLevel": "detailed"
        },
        {
          "id": "S5-L04",
          "title": "RAG 评测与数据治理",
          "contentLevel": "detailed"
        }
      ]
    },
    {
      "id": "06",
      "title": "多 Agent 与架构取舍",
      "deliverable": "有基线对照的角色协作方案和保留/回退 ADR。",
      "lessons": [
        {
          "id": "S6-L01",
          "title": "路由与分工：先证明需要多 Agent",
          "contentLevel": "detailed"
        },
        {
          "id": "S6-L02",
          "title": "交接、证据包与冲突处理",
          "contentLevel": "detailed"
        },
        {
          "id": "S6-L03",
          "title": "协作评测：质量、延迟与成本",
          "contentLevel": "detailed"
        }
      ]
    },
    {
      "id": "07",
      "title": "评测、观测与生产交付",
      "deliverable": "评测回归、脱敏 trace、容量/部署方案与真实模型证据。",
      "lessons": [
        {
          "id": "S7-L01",
          "title": "评测集、评分器与回归门槛",
          "contentLevel": "detailed"
        },
        {
          "id": "S7-L02",
          "title": "Trace、日志与费用观测",
          "contentLevel": "detailed"
        },
        {
          "id": "S7-L03",
          "title": "部署、限流、降级与运维",
          "contentLevel": "detailed"
        },
        {
          "id": "S7-L04",
          "title": "真实模型接入与可复现证据",
          "contentLevel": "detailed"
        }
      ]
    },
    {
      "id": "08",
      "title": "毕业项目与求职表达",
      "deliverable": "可演示工作台、架构与 ADR、项目简历段及模拟面试。",
      "lessons": [
        {
          "id": "S8-L01",
          "title": "毕业项目：从需求到验收",
          "contentLevel": "detailed"
        },
        {
          "id": "S8-L02",
          "title": "系统设计与陌生故障答辩",
          "contentLevel": "detailed"
        },
        {
          "id": "S8-L03",
          "title": "作品集、简历与求职演练",
          "contentLevel": "detailed"
        }
      ]
    }
  ]
} as const;
