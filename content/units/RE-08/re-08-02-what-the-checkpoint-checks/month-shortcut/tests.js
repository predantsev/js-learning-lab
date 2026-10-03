import { createElement, useEffect, useState } from 'react';
import * as testing from './testing.js';
import MonthTotals from './MonthTotals';
import { expenses } from './expenses.js';

// The learner's tests were registered when main.jsx imported MonthTotals.test.jsx; here they run
// again with print: false, sometimes against a broken copy of MonthTotals put in its place.
// testing.render() mounts every copy inside <StrictMode>.
async function runSuite(replacement) {
  testing.restoreComponents();
  if (replacement) testing.replaceComponent(MonthTotals, replacement);
  try {
    return await testing.run({ print: false, bail: Boolean(replacement) });
  } finally {
    testing.restoreComponents();
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

function shiftMonth(month, step) {
  const [year, number] = month.split('-').map(Number);
  const index = year * 12 + (number - 1) + step;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

// A copy of MonthTotals with the same screen and one fault in its keyboard effect.
function brokenTotals(fault) {
  const h = createElement;
  return function BrokenMonthTotals() {
    const [month, setMonth] = useState('2026-03');
    useEffect(() => {
      if (fault === 'no-listener') return undefined;
      function handleKey(event) {
        if (event.key === 'ArrowRight') setMonth((current) => shiftMonth(current, 1));
        if (event.key === 'ArrowLeft') setMonth((current) => shiftMonth(current, -1));
      }
      window.addEventListener('keydown', handleKey);
      if (fault === 'no-cleanup') return undefined;
      // 'other-function': removes a new arrow function, not the listener that was added.
      return () => window.removeEventListener('keydown', (event) => handleKey(event));
    }, []);
    const inMonth = expenses.filter((expense) => expense.date.startsWith(month));
    const totalMinor = inMonth.reduce((sum, expense) => sum + expense.amountMinor, 0);
    return h('section', null,
      h('h2', null, L.monthWord, ' ', month),
      h('p', null, L.shortcutHint),
      h('p', null, L.countLabel, ' ', inMonth.length, ' · ', L.totalLabel, ' ', (totalMinor / 100).toFixed(2)),
      h('ul', null, inMonth.map((expense) => h('li', { key: expense.id }, expense.label, ' — ', (expense.amountMinor / 100).toFixed(2)))));
  };
}

let passesWithCorrectCode = false;
async function expectCatches(fault) {
  expect(passesWithCorrectCode, 'your tests pass with the correct MonthTotals (the first check)').toBe(true);
  const results = await runSuite(brokenTotals(fault));
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken version').toBe(true);
}

test('your tests pass with the correct MonthTotals', async () => {
  const results = await runSuite();
  expect(results.length, 'number of tests in MonthTotals.test.jsx').toBeGreaterThanOrEqual(2);
  expect(failing(results), 'your tests that fail with the correct MonthTotals').toEqual([]);
  passesWithCorrectCode = true;
});

test('one of your tests fails when the cleanup is missing', async () => {
  await expectCatches('no-cleanup');
});

test('one of your tests fails when the cleanup removes a different function', async () => {
  await expectCatches('other-function');
});

test('one of your tests fails when the arrow keys do nothing', async () => {
  await expectCatches('no-listener');
});
