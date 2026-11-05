// Authoring format: original teaching cases, explicit limits, runnable local demonstrations.
export function lesson(stage, number, title, summary, sections, demo, questions, checks, project, sources) {
  const id = "S" + Number(stage) + "-L" + String(number).padStart(2, "0");
  return {
    id, stage, title, summary, duration: "35–60 分钟 + 项目练习",
    sections, project, sources,
    goals: sections.map(section => section[0]),
    experiments: [{ id: "demo", label: id + " / 本地机制演示", title: demo[0],
      intro: "先预测输出，再运行并修改一个条件。这是教学用的 JavaScript 机制演示，不是真实模型、数据库、协议 SDK 或生产系统。",
      code: demo[1], expected: demo[2], hint: demo[3] }],
    checkpoints: questions.map((text, index) => ({ id: "C" + (index + 1),
      title: ["解释关键机制", "定位一个反例", "定义验证证据"][index], badge: "开放作答",
      text, hint: "结合本课案例回答，写出结论、边界、证据和仍未验证的事项；不要只列术语。" })),
    quiz: checks.map((check, index) => {
      // Distribute correct positions; these are public practice, never formal exam secrets.
      const offset = (Number(stage) + number + index) % 4;
      const options = [...check[1].slice(offset), ...check[1].slice(0, offset)];
      return { id: "Q" + (index + 1), question: check[0], options, answer: (4 - offset) % 4,
        explanation: check[2] };
    }),
  };
}
export const sources = {
  abort: ["AbortController", "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"],
  stream: ["MDN SSE", "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events"],
  tools: ["OpenAI Function calling", "https://developers.openai.com/api/docs/guides/function-calling"],
  schema: ["OpenAI Structured outputs", "https://developers.openai.com/api/docs/guides/structured-outputs"],
  evals: ["OpenAI Evaluation best practices", "https://developers.openai.com/api/docs/guides/evaluation-best-practices"],
  agents: ["Anthropic Building effective agents", "https://www.anthropic.com/research/building-effective-agents"],
  mcp: ["MCP 架构（2026-07-28）", "https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture"],
  mcpSecurity: ["MCP 安全实践（2026-07-28）", "https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices"],
  python: ["Python 官方教程", "https://docs.python.org/3/tutorial/"],
  fastapi: ["FastAPI 并发与 async", "https://fastapi.tiangolo.com/async/"],
  pg: ["PostgreSQL 事务隔离", "https://www.postgresql.org/docs/current/transaction-iso.html"],
  traces: ["OpenTelemetry Traces", "https://opentelemetry.io/docs/concepts/signals/traces/"],
  docker: ["Docker 构建实践", "https://docs.docker.com/build/building/best-practices/"],
  retrieval: ["Sentence Transformers Retrieve & Re-Rank", "https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html"],
  security: ["OWASP LLM 应用安全", "https://owasp.org/projects/top-10-for-large-language-model-applications"],
  llm: ["Hugging Face LLM Course", "https://huggingface.co/learn/llm-course/chapter1/1"],
  prompting: ["OpenAI Prompt engineering", "https://developers.openai.com/api/docs/guides/prompt-engineering"],
  indexes: ["PostgreSQL 索引", "https://www.postgresql.org/docs/current/indexes.html"],
};
