import { createElement, useEffect, useState } from 'react';
import * as testing from './testing.js';
import ExpenseBoard from './ExpenseBoard';
import { settings, resetServer } from './fakeServer.js';

// The learner's tests were registered when main.jsx imported ExpenseBoard.test.jsx; here they run
// again with print: false, sometimes against a broken copy of ExpenseBoard put in its place.
async function runSuite({ replacement, slow = false } = {}) {
  testing.restoreComponents();
  if (replacement) testing.replaceComponent(ExpenseBoard, replacement);
  settings.saveDelayMs = slow ? 1000 : 300;
  try {
    return await testing.run({ print: false, beforeEach: resetServer });
  } finally {
    testing.restoreComponents();
    settings.saveDelayMs = 300;
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

let passesWithCorrectCode = false;
async function expectCatches(replacement) {
  expect(passesWithCorrectCode, 'your tests pass with the correct ExpenseBoard (the first check)').toBe(true);
  const results = await runSuite({ replacement });
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken version').toBe(true);
}

// A broken copy of ExpenseBoard: the same screen, with one fault switched on.
function brokenBoard({ refresh = true, showError = true, addOnFailure = false }) {
  const h = createElement;
  return function BrokenExpenseBoard() {
    const [expenses, setExpenses] = useState(null);
    const [round, setRound] = useState(0);
    const [label, setLabel] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('idle');
    useEffect(() => {
      const controller = new AbortController();
      fetch('/api/expenses', { signal: controller.signal }).then((r) => r.json()).then(setExpenses).catch(() => {});
      return () => controller.abort();
    }, [round]);
    async function handleSubmit(event) {
      event.preventDefault();
      setStatus('saving');
      const amountMinor = Math.round(Number(amount) * 100);
      const response = await fetch('/api/expenses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label, amountMinor }) });
      if (response.ok) {
        setLabel(''); setAmount(''); setStatus('saved');
        if (refresh) setRound((current) => current + 1);
      } else {
        if (addOnFailure) setExpenses((current) => [...current, { id: 'e-new', label, amountMinor }]);
        setStatus(showError ? 'failed' : 'idle');
      }
    }
    return h('section', null,
      h('form', { onSubmit: handleSubmit },
        h('label', { htmlFor: 'expense-label' }, L.labelField),
        h('input', { id: 'expense-label', value: label, onChange: (event) => setLabel(event.target.value) }),
        h('label', { htmlFor: 'expense-amount' }, L.amountField),
        h('input', { id: 'expense-amount', value: amount, onChange: (event) => setAmount(event.target.value) }),
        h('button', { type: 'submit', disabled: status === 'saving' }, L.save)),
      h('p', { role: 'status' }, status === 'saved' ? L.saved : ''),
      h('p', { role: 'alert' }, status === 'failed' ? L.saveFailed : ''),
      expenses === null ? h('p', null, L.loading) : h('ul', { 'aria-label': L.listName },
        expenses.map((expense) => h('li', { key: expense.id }, expense.label, ' — ', (expense.amountMinor / 100).toFixed(2)))));
  };
}

test('your tests pass with the correct ExpenseBoard', async () => {
  const results = await runSuite();
  expect(results.length, 'number of tests in ExpenseBoard.test.jsx').toBeGreaterThanOrEqual(2);
  expect(failing(results), 'your tests that fail with the correct ExpenseBoard').toEqual([]);
  passesWithCorrectCode = true;
});

test('your tests still pass when saving takes 1 second', async () => {
  expect(passesWithCorrectCode, 'your tests pass with the correct ExpenseBoard (the first check)').toBe(true);
  const results = await runSuite({ slow: true });
  expect(failing(results), 'your tests that fail when saving takes 1 s').toEqual([]);
});

test('one of your tests fails when a saved expense never appears in the list', async () => {
  await expectCatches(brokenBoard({ refresh: false }));
});

test('one of your tests fails when a failed save shows no error', async () => {
  await expectCatches(brokenBoard({ showError: false }));
});

test('one of your tests fails when a failed save still adds the expense to the list', async () => {
  await expectCatches(brokenBoard({ addOnFailure: true }));
});
