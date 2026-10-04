// Driver (read-only): starts your app on a free 127.0.0.1 port, requests /, /missing and / again
// with a damaged book, and prints what came back.
import { createApp } from './app.js';
import { books } from './books.js';

let calls = 0;
const damaged = [{ id: 'b-09', title: null, author: '?', status: 'reading', ownerNote: '' }];
const app = createApp({
  loadBooks: () => (calls++ === 2 ? damaged : books),
  log: (entry) => console.log(`log: ${JSON.stringify(entry)}`),
});
await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${app.address().port}`;
try {
  for (const path of ['/', '/missing', '/', '/']) {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(2000) });
    const text = await response.text();
    console.log(`GET ${path} → ${response.status} ${response.headers.get('content-type')}`);
    if (path === '/' && response.status === 200 && calls === 1) console.log(text);
  }
} catch (error) {
  console.log(`%%clientError%%: ${error.message}`);
} finally {
  app.closeAllConnections();
  app.close();
}
