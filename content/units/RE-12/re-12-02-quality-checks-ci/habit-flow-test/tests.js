import { createElement, useState } from 'react';
import * as testing from './testing.js';
import HabitBoard from './HabitBoard';

// The learner's tests were registered when main.jsx imported HabitBoard.test.jsx; here they run
// again with print: false, sometimes against a broken copy of HabitBoard put in its place.
async function runSuite(replacement) {
  testing.restoreComponents();
  if (replacement) {
    testing.replaceComponent(HabitBoard, replacement);
    testing.setDefaultTimeout(600);
  }
  try {
    return await testing.run({ print: false, bail: Boolean(replacement) });
  } finally {
    testing.restoreComponents();
    testing.setDefaultTimeout(2000);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

let passesWithCorrectCode = false;
async function expectCatches(replacement) {
  expect(passesWithCorrectCode, 'your tests pass with the correct HabitBoard (the first check)').toBe(true);
  const results = await runSuite(replacement);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken version').toBe(true);
}

// A broken copy of HabitBoard: the same screen, with one fault switched on.
function brokenBoard({ add = true, replace = false, clear = true }) {
  const h = createElement;
  const start = [{ id: 'h-1', name: L.walk }, { id: 'h-2', name: L.read }];
  return function BrokenHabitBoard() {
    const [habits, setHabits] = useState(start);
    const [name, setName] = useState('');
    function handleSubmit(event) {
      event.preventDefault();
      const trimmed = name.trim();
      if (trimmed === '') return;
      const habit = { id: `h-${habits.length + 1}`, name: trimmed };
      if (add) setHabits((current) => (replace ? [habit] : [...current, habit]));
      if (clear) setName('');
    }
    return h('section', null,
      h('form', { onSubmit: handleSubmit },
        h('label', { htmlFor: 'habit-name' }, L.habitName),
        h('input', { id: 'habit-name', value: name, onChange: (event) => setName(event.target.value) }),
        h('button', { type: 'submit' }, L.add)),
      h('ul', { 'aria-label': L.habitsList }, habits.map((habit) => h('li', { key: habit.id }, habit.name))));
  };
}

test('your tests pass with the correct HabitBoard', async () => {
  const results = await runSuite();
  expect(results.length, 'number of tests in HabitBoard.test.jsx').toBeGreaterThanOrEqual(1);
  expect(failing(results), 'your tests that fail with the correct HabitBoard').toEqual([]);
  passesWithCorrectCode = true;
});

test('one of your tests fails when an added habit never appears', async () => {
  await expectCatches(brokenBoard({ add: false }));
});

test('one of your tests fails when adding a habit hides the habits that were there', async () => {
  await expectCatches(brokenBoard({ replace: true }));
});

test('one of your tests fails when the field keeps the name after adding', async () => {
  await expectCatches(brokenBoard({ clear: false }));
});
