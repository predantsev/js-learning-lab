// The reading-list SSR route.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createElement as h, renderToString } from './mini-react.js';
import { clientElement } from './client.js';
import { config } from './config.js';

export function createApp({ loadBooks, log }) {
  return http.createServer((req, res) => {
    res.writeHead(501, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not implemented');
  });
}
