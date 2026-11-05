import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHandler } from '../server/app.ts';
import { MockProvider } from '../server/providers/mock.ts';
import { SCENARIOS } from '../server/providers/types.ts';
async function withApi(run: (base: string) => Promise<void>) {
  const server = createServer(createHandler());
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing address');
  try { await run('http://127.0.0.1:' + address.port); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
test('health identifies mock-only infrastructure without claiming course completion', () => withApi(async base => {
  const response = await fetch(base + '/api/health');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.provider, 'mock');
  assert.equal(data.homework, 'not-assessed');
}));
test('unknown endpoints return structured 404', () => withApi(async base => {
  const response = await fetch(base + '/api/not-found');
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'NOT_FOUND');
}));
test('malformed HTTP JSON is rejected before learner logic', () => withApi(async base => {
  const response = await fetch(base + '/api/triage', { method: 'POST', body: '{' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_JSON');
}));
test('request body size limit is enforced', () => withApi(async base => {
  const response = await fetch(base + '/api/triage', { method: 'POST', body: JSON.stringify({ text: 'x'.repeat(20_000) }) });
  assert.equal(response.status, 413);
}));
test('fixture returns deterministic output with honest usage provenance', async () => {
  const reply = await new MockProvider().generate({ text: 'a', prompt: 'b', scenario: 'valid' }, { signal: new AbortController().signal });
  assert.equal(JSON.parse(reply.text).category, 'bug');
  assert.equal(reply.model, 'fixture-v1');
  assert.equal(reply.usage, null);
});
test('fault scenarios include structural, semantic, timeout and upstream cases', () => {
  for (const name of ['invalid-json', 'wrong-shape', 'empty-summary', 'timeout', 'upstream-error']) assert.ok(SCENARIOS.some(value => value === name));
});
test('mock provider actually observes cancellation', async () => {
  const controller = new AbortController();
  const promise = new MockProvider().generate({ text: 'a', prompt: 'b', scenario: 'timeout' }, { signal: controller.signal });
  controller.abort();
  await assert.rejects(promise, { name: 'AbortError' });
});

