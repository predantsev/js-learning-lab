// renderPage(habits) returns the complete HTML document for GET /.
import { createElement as h, renderToString } from './mini-react.js';
import { HabitList } from './HabitList.js';
import { habits as sampleHabits } from './habits.js';

export function renderPage(habits) {
  const markup = renderToString(h(HabitList, { habits: sampleHabits }));
  return `<!doctype html>
<html lang="%%lang%%">
<head>
<meta charset="utf-8">
<title>%%pageTitle%%</title>
</head>
<body>
<div id="root">${markup}</div>
<script type="module" src="/client.js"></script>
</body>
</html>`;
}
