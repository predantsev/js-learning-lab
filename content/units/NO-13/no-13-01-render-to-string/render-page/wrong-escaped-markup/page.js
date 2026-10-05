// renderPage(habits) returns the complete HTML document for GET /.
import { createElement as h, renderToString } from './mini-react.js';
import { HabitList } from './HabitList.js';

export function renderPage(habits) {
  const markup = renderToString(h(HabitList, { habits }));
  return `<!doctype html>
<html lang="%%lang%%">
<head>
<meta charset="utf-8">
<title>%%pageTitle%%</title>
</head>
<body>
<div id="root">${escapeHtml(markup)}</div>
<script type="module" src="/client.js"></script>
</body>
</html>`;
}

// Escapes text for HTML — applied here to markup that React already escaped.
function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
