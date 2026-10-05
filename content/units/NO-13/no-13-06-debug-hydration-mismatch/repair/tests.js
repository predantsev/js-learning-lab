import { createElement as h, renderToString } from './mini-react.js';
import { createApp } from './server.js';
import { clientElement } from './client.js';
import { config } from './config.js';

// Fresh data inside the checks: one task due on the server's "today", one with a private note.
const stored = () => [
  { id: 't-05', title: L.dentist, dueDate: '2026-03-10', done: false, internalNote: L.note },
  { id: 't-06', title: L.wardrobe, dueDate: '2026-03-10', done: true, internalNote: '' },
];
const damaged = () => [{ id: 't-09', title: null, dueDate: null, done: false, internalNote: '' }];

async function start(loadTasks) {
  expect(typeof createApp, 'type of createApp').toBe('function');
  const entries = [];
  const base = await listen(createApp({ loadTasks, today: '2026-03-10', log: (entry) => entries.push(entry) }));
  return { base, entries };
}

function parts(html) {
  const markup = html.match(/<div id="root">(.*?)<\/div><script/s)?.[1];
  const json = html.match(/<script id="initial-data" type="application\/json">(.*?)<\/script>/s)?.[1];
  expect(markup, '#root in the page').toBeDefined();
  expect(json, '#initial-data in the page').toBeDefined();
  return { markup, data: JSON.parse(json) };
}

test('the page answers 200 with the list', async () => {
  const { base } = await start(stored);
  const response = await request(`${base}/`);
  expect(response.status, 'status of GET /').toBe(200);
  expect(response.text, 'body of GET /').toContain(L.dentist);
});

// The client's clock during the check: a fixed day far from the server's "today", so a client that
// reads its own clock differs on every machine and on every date.
const CLIENT_NOW = Date.UTC(2031, 0, 15, 12);
function withClientClock(fn) {
  const RealDate = Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length > 0 ? args : [CLIENT_NOW])); }
    static now() { return CLIENT_NOW; }
  };
  try { return fn(); } finally { globalThis.Date = RealDate; }
}

test('the client render matches the server markup', async () => {
  const { base } = await start(stored);
  const { markup, data } = parts((await request(`${base}/`)).text);
  expect(typeof clientElement, 'type of clientElement').toBe('function');
  const clientMarkup = withClientClock(() => renderToString(clientElement(data)));
  expect(clientMarkup, 'the client render from the page data').toBe(markup);
});

test('the page holds no server setting', async () => {
  const { base } = await start(stored);
  const html = (await request(`${base}/`)).text;
  expect(html.includes(config.apiToken), 'the apiToken value in the page').toBe(false);
  expect(html.includes('dataDir'), 'dataDir in the page').toBe(false);
});

test('the initial data holds only public task fields', async () => {
  const { base } = await start(stored);
  const { data } = parts((await request(`${base}/`)).text);
  for (const task of data.tasks ?? []) {
    expect(Object.keys(task).sort(), `fields of task ${task.id}`).toEqual(['done', 'dueDate', 'id', 'title']);
  }
});

test('a render error answers 500 with the fallback page', async () => {
  const { base, entries } = await start(damaged);
  const response = await request(`${base}/`, { headers: { 'x-request-id': 'req-check-9' } });
  expect(response.status, 'status when the render throws').toBe(500);
  expect(response.text, 'body of the 500 answer').toContain(L.errorTitle);
  expect(response.text, 'body of the 500 answer').toContain('req-check-9');
  expect(entries.some((entry) => entry.requestId === 'req-check-9'), 'a log entry with the request id').toBe(true);
});

test('the server keeps answering after a render error', async () => {
  let call = 0;
  const { base } = await start(() => (call++ === 0 ? damaged() : stored()));
  expect((await request(`${base}/`)).status, 'status of the failing request').toBe(500);
  expect((await request(`${base}/`)).status, 'status of the next request').toBe(200);
});
