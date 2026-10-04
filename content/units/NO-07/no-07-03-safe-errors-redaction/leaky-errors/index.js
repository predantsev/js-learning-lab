// Calls two failing routes with a bearer token, as a signed-in client would, and prints the answers.
import { createApp } from './app.js';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const route of ['/habits', '/settings']) {
    const response = await fetch(base + route, {
      headers: { authorization: 'Bearer demo-session-7f3a' }, // a synthetic token
      signal: AbortSignal.timeout(2000),
    });
    const text = await response.text();
    console.log(`%%client%% GET ${route} → ${response.status} ${text}`);
    // The platform's console shortens paths inside the exercise folder, so check the raw text here.
    console.log(`  %%absolutePath%%: ${text.includes(process.cwd()) ? '%%yes%%' : '%%no%%'}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
