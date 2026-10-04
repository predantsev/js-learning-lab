// A planner API that lists open tasks by due date, a page at a time: by offset or by cursor.
import http from 'node:http';
import { readJsonBody, sendJson } from './http-helpers.js';

const seedTasks = [
  { id: 't-01', title: '%%t01%%', dueDate: '2026-03-01', done: false },
  { id: 't-02', title: '%%t02%%', dueDate: '2026-03-02', done: false },
  { id: 't-03', title: '%%t03%%', dueDate: '2026-03-03', done: false },
  { id: 't-11', title: '%%t11%%', dueDate: '2026-03-04', done: true },
  { id: 't-04', title: '%%t04%%', dueDate: '2026-03-05', done: false },
  { id: 't-05', title: '%%t05%%', dueDate: '2026-03-05', done: false },
  { id: 't-06', title: '%%t06%%', dueDate: '2026-03-07', done: false },
  { id: 't-07', title: '%%t07%%', dueDate: '2026-03-08', done: false },
  { id: 't-12', title: '%%t12%%', dueDate: '2026-03-08', done: true },
  { id: 't-08', title: '%%t08%%', dueDate: '2026-03-09', done: false },
  { id: 't-09', title: '%%t09%%', dueDate: '2026-03-10', done: false },
  { id: 't-10', title: '%%t10%%', dueDate: '2026-03-12', done: false },
];

const byText = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
// Sort by due date. Two tasks with the same date count as equal here.
const compareTasks = (a, b) => byText(a.dueDate, b.dueDate);

export function createApp() {
  const tasks = seedTasks.map((task) => ({ ...task })); // a fresh copy for every app

  async function handle(request, response) {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname !== '/tasks') return sendJson(response, 404, { error: 'not found' });
    if (request.method === 'POST') {
      const task = { done: false, ...(await readJsonBody(request)) };
      tasks.push(task);
      return sendJson(response, 201, task);
    }
    const limit = Number(url.searchParams.get('limit') ?? 4);
    // 1. filter  2. sort  3. take one page
    const open = tasks.filter((task) => !task.done);
    const sorted = open.toSorted(compareTasks);
    let rest = sorted;
    if (url.searchParams.has('offset')) {
      rest = sorted.slice(Number(url.searchParams.get('offset')));
    } else if (url.searchParams.has('cursor')) {
      const last = tasks.find((task) => task.id === url.searchParams.get('cursor'));
      rest = sorted.filter((task) => compareTasks(task, last) > 0); // only what sorts after the cursor
    }
    const items = rest.slice(0, limit);
    return sendJson(response, 200, { items, nextCursor: rest.length > limit ? items.at(-1).id : null });
  }

  return http.createServer((request, response) => {
    handle(request, response).catch((error) => sendJson(response, error.status ?? 500, { error: 'internal' }));
  });
}
