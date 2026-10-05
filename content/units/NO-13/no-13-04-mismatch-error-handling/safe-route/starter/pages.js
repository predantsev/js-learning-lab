// Ready-made page builders (read-only).
import { createElement as h, renderToString } from './mini-react.js';
import { TaskList } from './TaskList.js';

// The full page. Throws whatever TaskList throws while rendering.
export function renderPage(tasks) {
  return `<!doctype html><html lang="%%lang%%"><head><meta charset="utf-8"><title>%%pageTitle%%</title></head>`
    + `<body><div id="root">${renderToString(h(TaskList, { tasks }))}</div></body></html>`;
}

// The request id comes from a request header: untrusted text, so it is escaped for HTML.
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

// A safe page for status 500: it names the request id and nothing about the error itself.
export function fallbackPage(requestId) {
  return `<!doctype html><html lang="%%lang%%"><head><meta charset="utf-8"><title>%%errorTitle%%</title></head>`
    + `<body><h1>%%errorTitle%%</h1><p>%%errorText%% <code>${escapeHtml(requestId)}</code></p></body></html>`;
}
