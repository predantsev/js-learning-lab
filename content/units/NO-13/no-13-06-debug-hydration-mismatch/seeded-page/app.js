// The seeded app: a server render and the client's render, each with one defect too many.
import http from 'node:http';
import { createElement as h, renderToString } from './mini-react.js';
import { HabitList } from './HabitList.js';

export const settings = { syncToken: 'demo-SYNC-not-a-real-secret', locale: 'uk-UA' };
const habits = [
  { id: 'h-01', name: '%%exercise%%', completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: '%%water%%', completions: ['2026-03-01'] },
];

export function createSeededServer() {
  return http.createServer((req, res) => {
    const today = '2026-03-01';
    const markup = renderToString(h(HabitList, { habits, today }));
    const json = JSON.stringify({ habits, today, settings });
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(`<div id="root">${markup}</div><script id="initial-data" type="application/json">${json}</script>`);
  });
}

// What the client entry renders while hydrating.
export function clientRender(data) {
  return renderToString(h(HabitList, { habits: data.habits, today: new Date(Date.now()).toISOString().slice(0, 10) }));
}
