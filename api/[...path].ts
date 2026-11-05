// Vercel serverless 入口：复用本地 Node 服务同一套 handler，保证行为一致。
// 平台把 /api/* 的请求路由到这里（catch-all），req.url 保持原始路径。
import { createHandler } from '../server/app.ts';

export default createHandler();
