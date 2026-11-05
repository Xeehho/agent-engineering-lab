import { pathToFileURL } from 'node:url';
import { MockProvider } from '../../server/providers/mock.ts';

type Counter = { count: number };

export async function lessonOneObservations() {
  // Deliberately wrong assertion for teaching: the compiler trusts this statement.
  const counter = JSON.parse('{"count":"three"}') as Counter;
  let numericMethodError: string | null = null;
  try { counter.count.toFixed(0); }
  catch (error) { numericMethodError = error instanceof Error ? error.name : 'unknown'; }

  const parsedScalar: unknown = JSON.parse('"hello"');
  const simulatedHttp = new Response(null, { status: 503 });
  const input = '请增加暗色模式';
  const mock = await new MockProvider().generate(
    { text: input, prompt: 'offline teaching example', scenario: 'valid' },
    { signal: new AbortController().signal },
  );
  return {
    experiment: 'S1-L01 / offline only',
    assertion: { runtimeType: typeof counter.count, numericMethodError },
    jsonSyntax: { parsedValue: parsedScalar, runtimeType: typeof parsedScalar },
    localResponse: { status: simulatedHttp.status, ok: simulatedHttp.ok, remoteCallMade: false },
    fixture: {
      input, returnedText: mock.text, provider: 'mock', model: mock.model,
      realModelVerified: false, businessAccuracyMeasured: false,
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await lessonOneObservations(), null, 2));
}
