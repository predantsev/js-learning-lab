// Ready-made helpers (read-only).

const ESCAPES = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' };

// JSON text that cannot close a <script> element.
export function serializeForHtml(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => ESCAPES[char]);
}

export function page(markup, json) {
  return `<!doctype html><html lang="%%lang%%"><head><meta charset="utf-8"><title>%%pageTitle%%</title></head>`
    + `<body><div id="root">${markup}</div>`
    + `<script id="initial-data" type="application/json">${json}</script>`
    + `<script type="module" src="/client.js"></script></body></html>`;
}

// The request id comes from a request header: untrusted text, so it is escaped for HTML.
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

// A safe page for status 500: only the request id.
export function fallbackPage(requestId) {
  return `<!doctype html><html lang="%%lang%%"><head><meta charset="utf-8"><title>%%errorTitle%%</title></head>`
    + `<body><h1>%%errorTitle%%</h1><p>%%errorText%% <code>${escapeHtml(requestId)}</code></p></body></html>`;
}
