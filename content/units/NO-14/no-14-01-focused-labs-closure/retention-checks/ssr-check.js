// Check 3 (SSR, NO-13): the server renders with a date it passes in, the page carries the same data,
// and the client's first render from that data must give the same markup.
import { createElement as h, renderToString } from './mini-react.js';

export function DueToday({ tasks, today }) {
  const due = tasks.filter((task) => !task.done && task.dueDate === today);
  return h('section', null,
    h('h2', null, '%%dueTitle%% ', today),
    h('ul', null, due.map((task) => h('li', { key: task.id }, task.title))));
}

// What the server sends: the markup of #root and the JSON of the page data.
export function serverRender(data) {
  return { html: renderToString(h(DueToday, data)), payload: JSON.stringify(data) };
}

// What a client entry would render first: the same component, from the page data it is given.
export function clientRender(data) {
  return renderToString(h(DueToday, data));
}
