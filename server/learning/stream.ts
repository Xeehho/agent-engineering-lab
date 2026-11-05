import type { ServerResponse } from 'node:http';
import type { ModelProvider } from '../providers/types.ts';
import { notImplemented } from '../errors.ts';
// S1-T4: define the streaming lifecycle before writing response headers.
export async function streamTriage(
  _input: unknown, _provider: ModelProvider, _response: ServerResponse, _signal: AbortSignal,
): Promise<void> {
  return notImplemented('S1-T4：流式事件、取消与终止状态');
}

