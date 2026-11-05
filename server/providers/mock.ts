import { setTimeout as delay } from 'node:timers/promises';
import type { GenerateInput, ModelProvider, ModelReply } from './types.ts';
// A deterministic infrastructure fixture, not evidence of a real model's ability.
export class MockProvider implements ModelProvider {
  readonly kind = 'mock' as const;
  async generate(input: GenerateInput, options: { signal: AbortSignal }): Promise<ModelReply> {
    await delay(input.scenario === 'timeout' ? 5_000 : 20, undefined, { signal: options.signal });
    if (input.scenario === 'upstream-error') throw new Error('Synthetic upstream failure');
    let text = JSON.stringify({
      category: 'bug', priority: 'high', summary: '用户反馈订单页面异常',
      missingInformation: ['浏览器版本', '复现步骤'],
    });
    if (input.scenario === 'invalid-json') text = '{"category":';
    if (input.scenario === 'wrong-shape') text = JSON.stringify({ category: 'other', priority: 7, summary: '错误结构' });
    if (input.scenario === 'empty-summary') text = JSON.stringify({
      category: 'bug', priority: 'high', summary: '   ', missingInformation: [],
    });
    return { text, model: 'fixture-v1', usage: null };
  }
}
