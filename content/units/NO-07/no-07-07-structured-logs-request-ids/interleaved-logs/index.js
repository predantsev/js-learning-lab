// Sends three requests at the same time, then tries to find the log lines of the one that failed.
import { createApp } from './app.js';
import { createLogger } from './logger.js';

const FORMAT = 'text'; // 'text' or 'json'

const { log, lines } = createLogger(FORMAT);
const server = createApp({ log });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const responses = await Promise.all(['/habits/h-01', '/habits/h-03', '/habits/h-07'].map((path) =>
    fetch(base + path, { signal: AbortSignal.timeout(2000) })));
  const failed = responses.find((response) => response.status >= 500);
  const failedId = failed.headers.get('x-request-id');
  console.log(`\n%%failedRequest%%: x-request-id ${failedId}`);
  const own = lines.filter((line) => line.includes(failedId));
  console.log(own.length > 0 ? own.join('\n') : '%%noMatch%%');
} finally {
  server.closeAllConnections();
  server.close();
}
