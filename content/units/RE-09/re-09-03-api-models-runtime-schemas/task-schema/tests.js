import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { parseTask } from './taskModel';
import { loadTask, loadTasks } from './tasksApi';
import { setAnswer } from './fixtureServer';

const GOOD = { id: 't-05', title: `  ${L.dentist}  `, due_date: '2026-03-10', is_done: false, priority: 'normal' };
const parse = (input) => {
  expect(typeof parseTask, 'type of parseTask').toBe('function');
  return parseTask(input);
};
const errorsOf = (input) => {
  const result = parse(input);
  expect(result?.ok, `ok for ${JSON.stringify(input)}`).toBe(false);
  return result.errors;
};
const GOOD_LIST = JSON.stringify([
  { id: 't-01', title: L.plants, due_date: '2026-03-02', is_done: false, priority: 'normal' },
  { id: 't-04', title: L.internet, due_date: '2026-02-27', is_done: true, priority: 'high' },
]);
const GOOD_DETAIL = JSON.stringify(GOOD);

test('a valid API task becomes a domain Task', () => {
  expect(parse(GOOD), 'parseTask of a valid task').toEqual({
    ok: true,
    value: { id: 't-05', title: L.dentist, dueDate: '2026-03-10', done: false, priority: 'normal' },
  });
  expect(parse({ ...GOOD, due_date: null, is_done: true }).value, 'a task without a due date that is done').toEqual({ id: 't-05', title: L.dentist, dueDate: null, done: true, priority: 'normal' });
});

test('anything that is not an object gives record: notObject', () => {
  for (const input of [null, 'task', 42, [GOOD], undefined]) {
    expect(errorsOf(input), `errors for ${JSON.stringify(input) ?? 'undefined'}`).toEqual({ record: 'notObject' });
  }
});

test('an unknown priority gives priority: unknownPriority', () => {
  expect(errorsOf({ ...GOOD, priority: 'urgent' }), 'errors for priority "urgent"').toEqual({ priority: 'unknownPriority' });
  expect(errorsOf({ ...GOOD, priority: undefined }), 'errors for a missing priority').toEqual({ priority: 'unknownPriority' });
});

test('due_date must be null or YYYY-MM-DD', () => {
  expect(errorsOf({ ...GOOD, due_date: '2026-3-10' }), 'errors for "2026-3-10"').toEqual({ dueDate: 'invalidDate' });
  expect(errorsOf({ ...GOOD, due_date: 20260310 }), 'errors for the number 20260310').toEqual({ dueDate: 'invalidDate' });
});

test('is_done must be a real boolean', () => {
  expect(errorsOf({ ...GOOD, is_done: 'false' }), 'errors for the text "false"').toEqual({ done: 'notBoolean' });
  expect(errorsOf({ ...GOOD, is_done: 0 }), 'errors for the number 0').toEqual({ done: 'notBoolean' });
});

test('id and title must be non-empty text', () => {
  expect(errorsOf({ ...GOOD, id: '' }), 'errors for an empty id').toEqual({ id: 'required' });
  expect(errorsOf({ ...GOOD, title: '   ' }), 'errors for a title of spaces').toEqual({ title: 'required' });
  expect(errorsOf({ ...GOOD, title: 7 }), 'errors for the title 7').toEqual({ title: 'required' });
});

test('every bad field is reported, not only the first', () => {
  expect(errorsOf({ id: 't-09', title: '', due_date: 'soon', is_done: 'yes', priority: 'urgent' }), 'errors for a task with four bad fields').toEqual({
    title: 'required', dueDate: 'invalidDate', done: 'notBoolean', priority: 'unknownPriority',
  });
});

test('loadTasks parses the list answer', async () => {
  setAnswer('list', GOOD_LIST);
  expect(await loadTasks(), 'loadTasks with a valid list').toEqual({
    ok: true,
    value: [
      { id: 't-01', title: L.plants, dueDate: '2026-03-02', done: false, priority: 'normal' },
      { id: 't-04', title: L.internet, dueDate: '2026-02-27', done: true, priority: 'high' },
    ],
  });
  setAnswer('list', JSON.stringify([{ id: 't-01', title: L.plants, due_date: null, is_done: false, priority: 'urgent' }]));
  expect(await loadTasks(), 'loadTasks with an unknown priority').toEqual({ ok: false, errors: { '0.priority': 'unknownPriority' } });
});

test('loadTask parses the detail answer', async () => {
  setAnswer('detail', GOOD_DETAIL);
  expect((await loadTask())?.ok, 'ok of loadTask with a valid task').toBe(true);
  setAnswer('detail', JSON.stringify({ ...GOOD, is_done: 'no' }));
  expect(await loadTask(), 'loadTask with is_done "no"').toEqual({ ok: false, errors: { done: 'notBoolean' } });
});

test('the screen shows an alert instead of a bad list', async () => {
  setAnswer('list', JSON.stringify([{ id: 't-01', title: L.plants, due_date: '2026-03-02', is_done: false, priority: 'urgent' }]));
  setAnswer('detail', GOOD_DETAIL);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  try {
    await waitFor(() => host.querySelector('[data-part="detail"]') !== null && host.querySelectorAll('[role="status"]').length === 0);
    expect(host.querySelector('[data-part="list"]'), 'the list of tasks').toBeNull();
    expect(host.querySelector('[role="alert"]'), 'the alert').toHaveTextContent('0.priority');
  } finally { root.unmount(); host.remove(); }
});
