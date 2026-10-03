import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { EXPENSES, summarizeCalls } from './expenses';
import { evidence } from './evidence.js';

// Every check mounts its own copy and records errors React reports.
async function mount() {
  const errors = [];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error.message) });
  root.render(createElement(App));
  await waitFor(() => host.querySelectorAll('tbody tr').length > 0);
  await settle();
  return { host, errors, finish: () => { root.unmount(); host.remove(); } };
}
const rows = (host) => [...host.querySelectorAll('tbody tr')];
const labelOf = (tr) => tr.querySelector('td').textContent;
const removeIn = (tr) => [...tr.querySelectorAll('*')].find((n) => n.children.length === 0 && n.textContent.trim() === L.remove);
const field = (host, name) => [...host.querySelectorAll('label')].find((l) => l.textContent.includes(name))?.querySelector('input, select');
const summaryText = (host) => host.querySelector('section').textContent;

test('searching filters the table', async () => {
  const copy = await mount();
  try {
    await user.type(field(copy.host, L.search), L.cinema);
    const labels = rows(copy.host).map(labelOf);
    expect(labels.length, 'rows shown').toBe(100);
    expect(labels.every((label) => label.includes(L.cinema)), 'every shown label contains the query').toBe(true);
    expect(copy.host, 'the page').toHaveTextContent(`${L.showing} 100 / 5000`);
  } finally { copy.finish(); }
});

test('typing in the search does not recompute the summary', async () => {
  const copy = await mount();
  try {
    const before = summarizeCalls();
    await user.type(field(copy.host, L.search), 'ab');
    expect(summarizeCalls() - before, 'summarizeExpenses calls while typing two letters').toBe(0);
  } finally { copy.finish(); }
});

test('adding an expense updates the table and the summary', async () => {
  const copy = await mount();
  try {
    await user.fill(field(copy.host, L.labelField), L.typed);
    await user.fill(field(copy.host, L.amountField), '120');
    await user.press('Enter', field(copy.host, L.amountField));
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(labelOf(rows(copy.host)[0]), 'the first row after adding').toBe(L.typed);
    expect(summaryText(copy.host), 'the summary after adding').toContain(`${L.count} ${EXPENSES.length + 1}`);
  } finally { copy.finish(); }
});

test('Delete is a real button', async () => {
  const copy = await mount();
  try {
    expect(removeIn(rows(copy.host)[0])?.tagName, 'the element that shows “Delete” in the first row').toBe('BUTTON');
  } finally { copy.finish(); }
});

test('deleting by keyboard removes the row and moves focus to the next Delete', async () => {
  const copy = await mount();
  try {
    const second = rows(copy.host)[1];
    const removed = labelOf(second);
    const control = removeIn(second);
    control.focus();
    await user.press('Enter', control);
    expect(rows(copy.host).map(labelOf), 'labels after deleting').not.toContain(removed);
    expect(summaryText(copy.host), 'the summary after deleting').toContain(`${L.count} ${EXPENSES.length - 1}`);
    expect(document.activeElement, 'focus after deleting').toBe(removeIn(rows(copy.host)[1]));
  } finally { copy.finish(); }
});

test('deleting the only shown expense moves focus to the heading', async () => {
  const copy = await mount();
  try {
    await user.fill(field(copy.host, L.labelField), L.typed);
    await user.fill(field(copy.host, L.amountField), '15');
    await user.press('Enter', field(copy.host, L.amountField));
    await user.type(field(copy.host, L.search), L.typed);
    expect(rows(copy.host).length, 'rows matching the new label').toBe(1);
    const control = removeIn(rows(copy.host)[0]);
    control.focus();
    await user.press('Enter', control);
    expect(rows(copy.host).length, 'rows after deleting').toBe(0);
    expect(document.activeElement, 'focus after deleting the last shown expense').toBe(copy.host.querySelector('h1'));
  } finally { copy.finish(); }
});

test('the evidence names the measured cause and a gain', () => {
  expect(evidence.records, 'records').toBe(EXPENSES.length);
  expect(evidence.slowest, 'slowest').toBe('ExpenseSummary');
  expect(typeof evidence.beforeMs, 'type of beforeMs').toBe('number');
  expect(typeof evidence.afterMs, 'type of afterMs').toBe('number');
  expect(evidence.afterMs, 'afterMs').toBeGreaterThan(0);
  expect(evidence.afterMs, 'afterMs compared with beforeMs').toBeLessThan(evidence.beforeMs);
  expect(String(evidence.change).trim().length, 'length of change').toBeGreaterThan(2);
});
