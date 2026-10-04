// Ready-made page builders (read-only).
import { createElement as h, renderToString } from './mini-react.js';
import { TaskList } from './TaskList.js';

// The full page. Throws whatever TaskList throws while rendering.
export function renderPage(tasks) {
  return `<!doctype html><html lang="%%lang%%"><head><meta charset="utf-8"><title>%%pageTitle%%</title></head>`
    + `<body><div id="root">${renderToString(h(TaskList, { tasks }))}</div></body></html>`;
}

// A safe page for status 500: it names the request id and nothing about the error itself.
export function fallbackPage(requestId) {
  return `<!doctype html><html lang="%%lang%%"><head><meta charset="utf-8"><title>%%errorTitle%%</title></head>`
    + `<body><h1>%%errorTitle%%</h1><p>%%errorText%% <code>${requestId}</code></p></body></html>`;
}
