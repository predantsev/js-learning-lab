// Driver (read-only): requests the page, compares it with the client's render, looks into the
// initial data, then sends a request whose data breaks the render, and one more after it.
import { createElement as h, renderToString } from './mini-react.js';
import { createApp } from './server.js';
import { clientElement } from './client.js';
import { tasks } from './tasks.js';
import { config } from './config.js';

const damaged = [{ id: 't-09', title: null, dueDate: null, done: false, internalNote: '' }];
let calls = 0;
const app = createApp({
  loadTasks: () => (calls++ === 1 ? damaged : tasks),
  today: '2026-03-01',
  log: (entry) => console.log(`log: ${JSON.stringify(entry)}`),
});
await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${app.address().port}`;
try {
  const response = await fetch(`${base}/`, { signal: AbortSignal.timeout(2000) });
  const html = await response.text();
  console.log(`GET / → ${response.status}`);
  const serverMarkup = html.match(/<div id="root">(.*?)<\/div><script/s)?.[1] ?? '';
  const json = html.match(/<script id="initial-data" type="application\/json">(.*?)<\/script>/s)?.[1] ?? 'null';
  const data = JSON.parse(json);
  const clientMarkup = renderToString(clientElement(data));
  console.log(`%%sameMarkup%%: ${serverMarkup === clientMarkup}`);
  if (serverMarkup !== clientMarkup) {
    console.log(`  %%server%%: ${serverMarkup}`);
    console.log(`  %%client%%: ${clientMarkup}`);
  }
  console.log(`%%tokenInPage%%: ${html.includes(config.apiToken)}`);
  console.log(`%%taskFields%%: ${Object.keys(data.tasks[0]).join(', ')}`);
  for (const id of ['req-2', 'req-3']) {
    const next = await fetch(`${base}/`, { headers: { 'x-request-id': id }, signal: AbortSignal.timeout(2000) });
    console.log(`${id}: ${next.status}`);
  }
} catch (error) {
  console.log(`%%clientError%%: ${error.message}`);
} finally {
  app.closeAllConnections();
  app.close();
}
