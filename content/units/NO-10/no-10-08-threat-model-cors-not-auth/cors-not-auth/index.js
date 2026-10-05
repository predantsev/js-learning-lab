// Three callers ask GET /notes. A browser would decide by the CORS header whether a page may
// read the answer; this program is not a browser, so it reads every answer, like curl does.
import { createApp } from './app.js';

const callers = [
  ['%%allowedPage%%', { origin: 'http://127.0.0.1:4310' }],
  ['%%foreignPage%%', { origin: 'https://evil.example' }],
  ['%%script%%', {}],
];

for (const requireSession of [false]) {
  const server = createApp({ requireSession });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  console.log(`— %%sessionCheck%%: ${requireSession} —`);
  try {
    for (const [label, headers] of callers) {
      const response = await fetch(`${base}/notes`, { headers, signal: AbortSignal.timeout(2000) });
      const allow = response.headers.get('access-control-allow-origin') ?? '—';
      console.log(`${label}: ${response.status}, Access-Control-Allow-Origin: ${allow}, %%body%%: ${await response.text()}`);
    }
  } finally {
    server.closeAllConnections();
    server.close();
  }
}
