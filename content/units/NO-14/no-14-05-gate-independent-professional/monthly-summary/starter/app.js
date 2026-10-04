// The monthly summary feature on node:http: an API route and a server-rendered page.
// See the task for every rule. createApp({ db, log }) returns an http.Server.
import http from 'node:http';
import { monthSummary } from './summary.js';
import { MonthSummary } from './MonthSummary.js';
import { createElement as h, renderToString } from './mini-react.js';

export function createApp({ db, log = () => {} }) {
  return http.createServer((request, response) => {
    response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: { code: 'NOT_FOUND' } }));
  });
}
