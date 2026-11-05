import { createServer } from 'node:http';
import { createHandler } from './app.ts';
const port = Number(process.env.PORT ?? 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const server = createServer(createHandler());
server.listen(port, '127.0.0.1', () => {
  console.log('Lab API: http://127.0.0.1:' + port + ' (mock only; no model API calls)');
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
