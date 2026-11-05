import test from 'node:test';
import assert from 'node:assert/strict';
import { triageTicket } from '../../server/learning/triage.ts';
import { MockProvider } from '../../server/providers/mock.ts';
import { LabError } from '../../server/errors.ts';
function options(signal = new AbortController().signal) { return { requestId: 'practice-01', signal, timeoutMs: 80 }; }
function matches(code: string, status: number) {
  return (error: unknown) => error instanceof LabError && error.code === code && error.status === status;
}
test('P01 valid fixture produces a validated result and mock provenance', async () => {
  const response = await triageTicket({ text: '订单页面无法加载', scenario: 'valid' }, new MockProvider(), options());
  assert.equal(response.result.category, 'bug');
  assert.equal(response.result.priority, 'high');
  assert.ok(response.result.summary.trim().length > 0);
  assert.ok(Array.isArray(response.result.missingInformation));
  assert.equal(response.requestId, 'practice-01');
  assert.equal(response.provenance.provider, 'mock');
  assert.equal(response.provenance.model, 'fixture-v1');
  assert.equal(response.provenance.usage, null);
  assert.ok(response.provenance.promptVersion);
});
for (const [name, input] of [
  ['P02 empty text', { text: '' }],
  ['P03 non-string text', { text: 123 }],
  ['P04 missing text', {}],
  ['P05 unsupported scenario', { text: 'a', scenario: 'other' }],
] as const) {
  test(name, async () => assert.rejects(triageTicket(input, new MockProvider(), options()), matches('VALIDATION_ERROR', 400)));
}
for (const scenario of ['invalid-json', 'wrong-shape', 'empty-summary']) {
  test('P06 invalid model response: ' + scenario, async () => {
    await assert.rejects(triageTicket({ text: '有效工单', scenario }, new MockProvider(), options()), matches('MODEL_OUTPUT_INVALID', 502));
  });
}
test('P07 upstream error is classified without leaking its raw details', async () => {
  await assert.rejects(triageTicket({ text: '有效工单', scenario: 'upstream-error' }, new MockProvider(), options()), matches('MODEL_UPSTREAM_ERROR', 502));
});
test('P08 timeout has a finite deadline and cancels upstream work', { timeout: 1_500 }, async () => {
  let cancelled = false;
  const provider = {
    kind: 'mock' as const,
    generate: async (_input: unknown, opts: { signal: AbortSignal }): Promise<never> =>
      new Promise((_resolve, reject) => {
        opts.signal.addEventListener('abort', () => { cancelled = true; reject(new Error('aborted')); }, { once: true });
      }),
  };
  const started = performance.now();
  await assert.rejects(triageTicket({ text: '有效工单', scenario: 'timeout' }, provider, options()), matches('MODEL_TIMEOUT', 504));
  assert.equal(cancelled, true);
  assert.ok(performance.now() - started < 1_000);
});
test('P09 an already-cancelled caller never starts model work', async () => {
  const controller = new AbortController(); controller.abort();
  let called = false;
  const provider = { kind: 'mock' as const, generate: async () => { called = true; throw new Error('must not run'); } };
  await assert.rejects(triageTicket({ text: '有效工单' }, provider, options(controller.signal)), matches('REQUEST_CANCELLED', 499));
  assert.equal(called, false);
});
