import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expensesReducer } from './expensesReducer';
import { loadExpenses } from './api';
import { ExpenseScreen } from './App';
import { GOOD, DAMAGED, setAnswer, getJson } from './fixtureServer';
import { toExpense } from './expenseModel';
import { subject } from './subject';
import { run } from './testing';

const lunch = { id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02' };
const ready = (amountMinor, confirmed = {}) => ({ status: 'ready', expenses: [{ ...lunch, amountMinor }], confirmed });
const reduce = (state, action) => {
  expect(typeof expensesReducer, 'type of expensesReducer').toBe('function');
  return expensesReducer(state, action);
};
const play = (reducer, state, actions) => actions.reduce((current, action) => reducer(current, action), state);
const amountOf = (state) => (state.status === 'ready' ? state.expenses[0].amountMinor : `(${state.status})`);
const started = (amountMinor, mutation) => ({ type: 'editStarted', id: 'e-06', amountMinor, mutation });
const confirmed = (mutation) => ({ type: 'editConfirmed', id: 'e-06', mutation });
const failed = (mutation, previousAmount) => ({ type: 'editFailed', id: 'e-06', mutation, previousAmount });

// ---- The seeded defects, written again in JavaScript, one at a time, on top of a correct reducer. ----
const setAmount = (expenses, id, amountMinor) => expenses.map((e) => (e.id === id ? { ...e, amountMinor } : e));
function seededReducer({ spreadOnFailure = false, blindRollback = false }) {
  return function reducer(state, action) {
    switch (action.type) {
      case 'loaded': return state.status !== 'loading' ? state : { status: 'ready', expenses: action.expenses, confirmed: {} };
      case 'loadFailed':
        if (spreadOnFailure) return { ...state, status: 'failed', message: action.message };
        return state.status !== 'loading' ? state : { status: 'failed', message: action.message };
      case 'retried': return state.status !== 'failed' ? state : { status: 'loading' };
      case 'editStarted': return state.status !== 'ready' ? state : { ...state, expenses: setAmount(state.expenses, action.id, action.amountMinor) };
      case 'editConfirmed':
        if (state.status !== 'ready') return state;
        return { ...state, confirmed: { ...state.confirmed, [action.id]: Math.max(state.confirmed[action.id] ?? 0, action.mutation) } };
      case 'editFailed':
        if (state.status !== 'ready') return state;
        if (!blindRollback && (state.confirmed[action.id] ?? 0) > action.mutation) return state;
        return { ...state, expenses: setAmount(state.expenses, action.id, action.previousAmount) };
      default: return state;
    }
  };
}
async function castLoad() {
  const body = await getJson();
  return { ok: true, value: body.map(toExpense) };
}

const original = { ...subject };
async function suiteWith(swaps) {
  Object.assign(subject, swaps);
  try {
    return await run({ print: false });
  } finally {
    Object.assign(subject, original);
    setAnswer(GOOD);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
async function expectCaught(swaps) {
  const results = await suiteWith(swaps);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with this defect').toBe(true);
}

test('loadFailed is rejected while ready and leaves no impossible state', () => {
  const state = ready(21050);
  expect(reduce(state, { type: 'loadFailed', message: '503' }) === state, 'ready + loadFailed returns the same state').toBe(true);
  expect(reduce({ status: 'loading' }, { type: 'loadFailed', message: '503' }), 'loading + loadFailed').toEqual({ status: 'failed', message: '503' });
});

test('a damaged answer becomes ok: false and the screen shows an alert', async () => {
  setAnswer(DAMAGED);
  const host = document.createElement('div');
  document.body.append(host);
  const errors = [];
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error) });
  try {
    const result = await loadExpenses();
    expect(result?.ok, 'ok of loadExpenses with a damaged answer').toBe(false);
    root.render(createElement(ExpenseScreen));
    await waitFor(() => host.querySelector('[role="alert"]') !== null || errors.length > 0);
    expect(errors.map((error) => `${error.name}: ${error.message}`), 'errors thrown while rendering').toEqual([]);
    expect(host.querySelector('[role="alert"]'), 'the alert on the screen').toBeTruthy();
  } finally { root.unmount(); host.remove(); setAnswer(GOOD); }
});

test('a failed older edit does not undo a newer confirmed one', () => {
  const end = play(reduce, ready(21050), [started(25000, 1), started(30000, 2), confirmed(2), failed(1, 21050)]);
  expect(amountOf(end), 'the amount after A fails late').toBe(30000);
});

test('a failed edit still rolls back when no newer edit is confirmed', () => {
  expect(amountOf(play(reduce, ready(21050), [started(25000, 1), failed(1, 21050)])), 'one edit that fails').toBe(21050);
  expect(amountOf(play(reduce, ready(21050), [started(25000, 1), confirmed(1), started(30000, 2), failed(2, 25000)])), 'an older confirmed edit, then a newer one that fails').toBe(25000);
});

test('your regression tests pass on the fixed code', async () => {
  const results = await suiteWith({});
  expect(results.length, 'number of tests in regressions.test.ts').toBeGreaterThanOrEqual(4);
  expect(failing(results), 'your tests that fail on your fixed code').toEqual([]);
});

test('a regression test catches the late loadFailed defect', async () => {
  await expectCaught({ expensesReducer: seededReducer({ spreadOnFailure: true }) });
});

test('a regression test catches the unchecked answer', async () => {
  await expectCaught({ loadExpenses: castLoad });
});

test('a regression test catches the blind rollback', async () => {
  await expectCaught({ expensesReducer: seededReducer({ blindRollback: true }) });
});
