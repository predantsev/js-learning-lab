// Renders the same list twice — as the server does and as a client entry would — and compares the HTML.
import { createElement as h, renderToString } from './mini-react.js';
import { DueList } from './DueList.js';

const tasks = [
  { id: 't-02', title: '%%books%%', dueDate: '2026-03-01' },
  { id: 't-05', title: '%%dentist%%', dueDate: '2026-03-10' },
];

// The server decides what "today" is and sends it along with the data.
const payload = { tasks, today: '2026-03-01' };
const serverHtml = renderToString(h(DueList, payload));

// A client that computes "today" from its own clock instead of reading it from the payload.
const clientToday = new Date().toISOString().slice(0, 10);
const clientHtml = renderToString(h(DueList, { tasks: payload.tasks, today: clientToday }));

function firstDifference(a, b) {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i += 1;
  return i === a.length && i === b.length ? -1 : i;
}

console.log(`%%server%%: ${serverHtml}`);
console.log(`%%client%%: ${clientHtml}`);
const at = firstDifference(serverHtml, clientHtml);
if (at === -1) {
  console.log('%%same%%');
} else {
  console.log(`%%differAt%% ${at}: "${serverHtml.slice(at, at + 12)}" ≠ "${clientHtml.slice(at, at + 12)}"`);
}
