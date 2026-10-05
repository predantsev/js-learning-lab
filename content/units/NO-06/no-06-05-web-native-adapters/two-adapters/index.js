// One planner API, one shared data layer, two adapters. Only the adapters know the platform.
import http from 'node:http';
import { createDataLayer } from './data-layer.js';
import { createNativeAdapter, createWebAdapter } from './adapters.js';

// A domain function from the JavaScript stage: pending tasks due on or before a day.
const countDue = (tasks, day) => tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= day).length;

const tasks = [
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false },
  { id: 't-02', title: '%%library%%', dueDate: '2026-03-01', done: false },
  { id: 't-04', title: '%%internet%%', dueDate: '2026-02-27', done: true },
];
const server = http.createServer((request, response) => {
  console.log(`[api] ${request.method} ${request.url}`);
  response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(tasks));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

try {
  const adapters = [
    createWebAdapter({ baseUrl: `http://127.0.0.1:${port}` }),
    createNativeAdapter({ target: 'ios-simulator', port }),
  ];
  for (const adapter of adapters) {
    const { records, stale, reason } = await createDataLayer(adapter).listRecords();
    const state = stale ? `%%stale%%: ${reason}` : '%%fresh%%';
    console.log(`${adapter.name} → ${adapter.baseUrl.replace(String(port), 'PORT')}: ${state}, %%due%% ${countDue(records, '2026-03-01')}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
