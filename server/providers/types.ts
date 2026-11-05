import type { Usage } from '../../shared/contracts.ts';
export interface GenerateInput { text: string; prompt: string; scenario: string }
export interface ModelReply { text: string; model: string; usage: Usage | null }
export interface ModelProvider {
  readonly kind: 'mock' | 'live';
  generate(input: GenerateInput, options: { signal: AbortSignal }): Promise<ModelReply>;
}
export const SCENARIOS = [
  'valid', 'invalid-json', 'wrong-shape', 'empty-summary', 'timeout', 'upstream-error',
] as const;
export type Scenario = (typeof SCENARIOS)[number];
