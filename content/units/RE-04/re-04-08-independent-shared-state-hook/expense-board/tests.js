import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { expensesReducer } from './expensesReducer';
import { useExpenses } from './useExpenses';
import { START_EXPENSES, STORAGE_KEY } from './expenses';
import { renderCounts } from './renders.js';

const E = (id, label, amountMinor) => ({ id, label, amountMinor });
function frozenState(selectedId = null) {
  const expenses = START_EXPENSES.map((e) => Object.freeze({ ...e }));
  return Object.freeze({ expenses: Object.freeze(expenses), selectedId });
}
const reduce = (state, action) => {
  expect(typeof expensesReducer, 'type of expensesReducer').toBe('function');
  return expensesReducer(state, action);
};
async function mount(element) {
  const errors = [];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error.message) });
  root.render(element);
  await settle();
  return { host, errors, finish: () => { root.unmount(); host.remove(); } };
}
async function mountApp(stored) {
  if (stored === undefined) storage.removeItem(STORAGE_KEY);
  else storage.setItem(STORAGE_KEY, stored);
  const copy = await mount(createElement(App));
  await waitFor(() => copy.host.querySelector('li') !== null || copy.errors.length > 0);
  return copy;
}
const rowLabels = (host) => [...host.querySelectorAll('li [data-id]')].map((b) => b.getAttribute('data-id'));

test('the reducer adds, selects and removes without changing the old state', () => {
  const start = frozenState();
  const added = reduce(start, { type: 'added', expense: E('e-20', L.cinema, 30000) });
  expect(added.expenses.map((e) => e.id), 'ids after adding e-20').toEqual(['e-01', 'e-02', 'e-03', 'e-20']);
  const selected = reduce(added, { type: 'selected', id: 'e-02' });
  expect(selected.selectedId, 'selectedId after selecting e-02').toBe('e-02');
  const removed = reduce(selected, { type: 'removed', id: 'e-01' });
  expect(removed.expenses.map((e) => e.id), 'ids after removing e-01').toEqual(['e-02', 'e-03', 'e-20']);
  expect(removed.selectedId, 'selectedId after removing another expense').toBe('e-02');
});

test('removing the selected expense clears the selection', () => {
  const state = reduce(frozenState(), { type: 'selected', id: 'e-03' });
  const next = reduce(state, { type: 'removed', id: 'e-03' });
  expect(next.selectedId, 'selectedId after removing the selected expense').toBeNull();
});

test('invalid transitions return the same state object', () => {
  const start = frozenState('e-01');
  const invalid = [
    { type: 'added', expense: E('e-21', L.lunch, 12.5) },
    { type: 'added', expense: E('e-22', L.lunch, 0) },
    { type: 'added', expense: E('e-23', '   ', 500) },
    { type: 'added', expense: E('e-02', L.lunch, 500) },
    { type: 'removed', id: 'e-99' },
    { type: 'selected', id: 'e-99' },
  ];
  for (const action of invalid) {
    expect(reduce(start, action) === start, `the same state came back for ${JSON.stringify(action)}`).toBe(true);
  }
});

test('two calls of useExpenses keep separate lists under their own keys', async () => {
  storage.removeItem('jsll.check.one');
  storage.setItem('jsll.check.two', JSON.stringify([E('e-30', L.lunch, 21050)]));
  const api = {};
  const probe = (key) => function Probe() { api[key] = useExpenses(key); return createElement('p', null, key); };
  const copy = await mount(createElement('div', null, createElement(probe('jsll.check.one')), createElement(probe('jsll.check.two'))));
  try {
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(api['jsll.check.one'][0].expenses.map((e) => e.id), 'first call starts from the starting list').toEqual(['e-01', 'e-02', 'e-03']);
    expect(api['jsll.check.two'][0].expenses.map((e) => e.id), 'second call starts from its stored list').toEqual(['e-30']);
    api['jsll.check.one'][1]({ type: 'added', expense: E('e-31', L.cinema, 30000) });
    await settle();
    expect(api['jsll.check.two'][0].expenses.map((e) => e.id), 'second list after adding to the first').toEqual(['e-30']);
    expect(JSON.parse(storage.getItem('jsll.check.one')).map((e) => e.id), 'stored under the first key').toEqual(['e-01', 'e-02', 'e-03', 'e-31']);
    expect(JSON.parse(storage.getItem('jsll.check.two')).map((e) => e.id), 'stored under the second key').toEqual(['e-30']);
  } finally { copy.finish(); storage.removeItem('jsll.check.one'); storage.removeItem('jsll.check.two'); }
});

test('damaged storage falls back to the starting list', async () => {
  for (const text of ['{broken', '{"expenses":[]}']) {
    const copy = await mountApp(text);
    try {
      expect(copy.errors, `errors React reported for the stored text ${text}`).toEqual([]);
      expect(rowLabels(copy.host), `rows for the stored text ${text}`).toEqual(['e-01', 'e-02', 'e-03']);
    } finally { copy.finish(); }
  }
  storage.removeItem(STORAGE_KEY);
});

test('the page selects, sums and remembers expenses', async () => {
  const copy = await mountApp(undefined);
  try {
    await user.click(copy.host.querySelector('[data-id="e-02"]'));
    expect(copy.host.querySelector('aside'), 'the detail panel after selecting e-02').toHaveTextContent(L.transit);
    expect(copy.host.querySelector('[data-total]'), 'the total line').toHaveTextContent('1545.50');
    const [labelInput, amountInput] = copy.host.querySelectorAll('form input');
    await user.fill(labelInput, L.cinema);
    await user.fill(amountInput, '300');
    await user.submit(copy.host.querySelector('form'));
    expect(copy.host.querySelector('[data-total]'), 'the total line after adding 300').toHaveTextContent('1845.50');
  } finally { copy.finish(); }
  const again = await mountApp(storage.getItem(STORAGE_KEY) ?? undefined);
  try {
    expect(rowLabels(again.host).length, 'rows after mounting again').toBe(4);
  } finally { again.finish(); storage.removeItem(STORAGE_KEY); }
});

test('typing in the form re-renders only the form', async () => {
  const copy = await mountApp(undefined);
  try {
    const before = { ...renderCounts };
    await user.type(copy.host.querySelector('form input'), 'abc');
    const delta = (name) => (renderCounts[name] ?? 0) - (before[name] ?? 0);
    expect(delta('AddExpenseForm'), 'AddExpenseForm renders while typing').toBeGreaterThan(0);
    for (const name of ['ExpenseApp', 'ExpenseList', 'ExpenseDetail', 'Summary']) expect(delta(name), `${name} renders while typing`).toBe(0);
  } finally { copy.finish(); storage.removeItem(STORAGE_KEY); }
});

test('after a keyboard add, focus is back in the label field', async () => {
  const copy = await mountApp(undefined);
  try {
    const [labelInput, amountInput] = copy.host.querySelectorAll('form input');
    await user.type(labelInput, L.cinema);
    await user.type(amountInput, '300');
    await user.press('Enter', amountInput);
    expect(rowLabels(copy.host).length, 'rows after Enter in the amount field').toBe(4);
    expect(copy.host.querySelectorAll('form input')[0], 'the label field after adding').toHaveFocus();
  } finally { copy.finish(); storage.removeItem(STORAGE_KEY); }
});

test('after a keyboard delete, focus moves to the next expense or the heading', async () => {
  const copy = await mountApp(undefined);
  try {
    const removeButton = (id) => copy.host.querySelector(`[data-id="${id}"]`).closest('li').querySelectorAll('button')[1];
    let target = removeButton('e-02');
    target.focus();
    await user.press('Enter', target);
    expect(rowLabels(copy.host), 'rows after deleting e-02').toEqual(['e-01', 'e-03']);
    expect(copy.host.querySelector('[data-id="e-03"]'), 'the next expense after deleting e-02').toHaveFocus();
    target = removeButton('e-03');
    target.focus();
    await user.press('Enter', target);
    expect(copy.host.querySelector('h2'), 'the heading after deleting the last expense').toHaveFocus();
  } finally { copy.finish(); storage.removeItem(STORAGE_KEY); }
});
