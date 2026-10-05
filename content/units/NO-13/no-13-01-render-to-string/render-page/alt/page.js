// renderPage(habits) returns the complete HTML document for GET /, built from a list of lines.
import { createElement as h, renderToString } from './mini-react.js';
import { HabitList } from './HabitList.js';

export function renderPage(habits) {
  const list = h(HabitList, { habits });
  return [
    '<!DOCTYPE html>',
    '<html lang="%%lang%%">',
    '<head><meta charset="UTF-8"><title>%%pageTitle%%</title></head>',
    '<body>',
    '<div id="root">' + renderToString(list) + '</div>',
    '<script src="/client.js" type="module"></script>',
    '</body>',
    '</html>',
  ].join('\n');
}
