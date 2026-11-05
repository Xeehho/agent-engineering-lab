import type { TriageResponse } from '../../shared/contracts.ts';
import type { ModelProvider } from '../providers/types.ts';
import { notImplemented } from '../errors.ts';
export interface TriageOptions { requestId: string; signal: AbortSignal; timeoutMs: number }
// S1-T1..T3: learner implementation. Contract: course/stage-01/assignment.md
// The teacher deliberately has not implemented the homework.
export async function triageTicket(
  _input: unknown, _provider: ModelProvider, _options: TriageOptions,
): Promise<TriageResponse> {
  return notImplemented('S1-T1～T3：输入校验、模型调用、结果校验、超时与错误分类');
}

