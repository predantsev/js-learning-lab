import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App, { AddExpenseForm, ExpenseList } from './App';
import { RecordsDispatchContext, useRecordsDispatch } from './recordsDispatch';

// Mounts an element in its own root and records errors React reports.
async function mount(element, ready) {
  const errors = [];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error) });
  root.render(element);
  await waitFor(() => ready(host) || errors.length > 0);
  await settle();
  return { host, errors, finish: () => { root.unmount(); host.remove(); } };
}
const withContext = (value, child) => createElement(RecordsDispatchContext, { value }, child);
const SAMPLE = [{ id: 'e-07', label: L.bulbs, amountMinor: 9990 }, { id: 'e-08', label: L.lunch, amountMinor: 21050 }];

test('useRecordsDispatch returns the function given to the context', async () => {
  const dispatch = spy();
  let seen = null;
  function Probe() { seen = useRecordsDispatch(); return createElement('p', null, 'probe'); }
  const copy = await mount(withContext(dispatch, createElement(Probe)), (host) => host.querySelector('p') !== null);
  try {
    expect(copy.errors.map((e) => e.message), 'errors React reported').toEqual([]);
    expect(seen === dispatch, 'the value returned by useRecordsDispatch is the function in the context').toBe(true);
  } finally { copy.finish(); }
});

test('outside the context the hook throws an error that names it', async () => {
  function Probe() { useRecordsDispatch(); return createElement('p', null, 'probe'); }
  const copy = await mount(createElement(Probe), (host) => host.querySelector('p') !== null);
  try {
    expect(copy.errors.length, 'errors React reported for a component outside the context').toBe(1);
    expect(copy.errors[0].message, 'the error message').toContain('useRecordsDispatch');
    expect(copy.errors[0].message, 'the error message').not.toContain('TODO');
  } finally { copy.finish(); }
});

test('a row sends removed through the context', async () => {
  const dispatch = spy();
  const copy = await mount(withContext(dispatch, createElement(ExpenseList, { expenses: SAMPLE })), (host) => host.querySelector('li button') !== null);
  try {
    await user.click(copy.host.querySelectorAll('li button')[1]);
    expect(dispatch, 'the dispatch in the context').toHaveBeenCalledWith({ type: 'removed', id: 'e-08' });
  } finally { copy.finish(); }
});

test('the form sends added through the context', async () => {
  const dispatch = spy();
  const copy = await mount(withContext(dispatch, createElement(AddExpenseForm)), (host) => host.querySelector('form') !== null);
  try {
    const [labelInput, amountInput] = copy.host.querySelectorAll('input');
    await user.fill(labelInput, L.cinema);
    await user.fill(amountInput, '300');
    await user.submit(copy.host.querySelector('form'));
    expect(dispatch.calls.length, 'calls of the dispatch in the context').toBe(1);
    const action = dispatch.calls[0][0];
    expect(action?.type, 'type of the dispatched action').toBe('added');
    expect(action?.expense?.label, 'label of the dispatched expense').toBe(L.cinema);
    expect(action?.expense?.amountMinor, 'amountMinor of the dispatched expense').toBe(30000);
  } finally { copy.finish(); }
});

test('the page still adds and removes expenses', async () => {
  const copy = await mount(createElement(App), (host) => host.querySelector('li') !== null);
  try {
    expect(copy.errors.map((e) => e.message), 'errors React reported').toEqual([]);
    const labels = () => [...copy.host.querySelectorAll('li span')].map((s) => s.textContent.trim());
    await user.click(copy.host.querySelectorAll('li button')[0]);
    expect(labels(), 'labels after removing the first').toEqual([L.transit, L.coffee]);
    const [labelInput, amountInput] = copy.host.querySelectorAll('form input');
    await user.fill(labelInput, L.cinema);
    await user.fill(amountInput, '300');
    await user.submit(copy.host.querySelector('form'));
    expect(copy.errors.map((e) => e.message), 'errors React reported after adding').toEqual([]);
    expect(labels(), 'labels after adding').toEqual([L.transit, L.coffee, L.cinema]);
    expect(copy.host.querySelector('section > p'), 'the total line').toHaveTextContent('1000.00');
  } finally { copy.finish(); }
});
