import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { LabError } from './errors.ts';
import { MockProvider } from './providers/mock.ts';
import { SCENARIOS } from './providers/types.ts';
import type { ModelProvider } from './providers/types.ts';
import { triageTicket } from './learning/triage.ts';
import { streamTriage } from './learning/stream.ts';
const MAX_BODY_BYTES = 16_384;
function json(res: ServerResponse, status: number, body: unknown) {
  if (res.writableEnded || res.destroyed) return;
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}
async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) throw new LabError('BODY_TOO_LARGE', '请求体过大', 413);
    chunks.push(bytes);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new LabError('INVALID_JSON', '请求不是有效JSON', 400); }
}
export function createHandler(provider: ModelProvider = new MockProvider()) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    const abort = new AbortController();
    res.on('close', () => { if (!res.writableEnded) abort.abort(); });
    try {
      if (req.method === 'GET' && path === '/api/health') {
        return json(res, 200, { ok: true, provider: provider.kind, stage: '01', homework: 'not-assessed' });
      }
      if (req.method === 'GET' && path === '/api/scenarios') return json(res, 200, SCENARIOS);
      if (req.method === 'POST' && (path === '/api/triage' || path === '/api/triage/stream')) {
        const input = await readJson(req);
        if (path.endsWith('/stream')) return await streamTriage(input, provider, res, abort.signal);
        const result = await triageTicket(input, provider, {
          requestId: randomUUID(), signal: abort.signal, timeoutMs: 1_200,
        });
        return json(res, 200, result);
      }
      return json(res, 404, { error: { code: 'NOT_FOUND', message: '接口不存在' } });
    } catch (error) {
      const status = error instanceof LabError ? error.status : 500;
      const code = error instanceof LabError ? error.code : 'INTERNAL_ERROR';
      const message = error instanceof LabError ? error.message : '请求失败';
      if (res.headersSent) { res.end(); return; }
      return json(res, status, { error: { code, message } });
    }
  };
}

