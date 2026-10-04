import { createElement, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as testing from './testing.js';
import { HabitRow } from './HabitRow.jsx';

// The learner's tests were registered when main.jsx imported HabitRow.test.jsx; here they run
// again with print: false, sometimes against a broken copy of HabitRow put in its place.
async function runSuite(replacement) {
  testing.restoreComponents();
  if (replacement) {
    testing.replaceComponent(HabitRow, replacement);
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

// A broken copy of HabitRow: the same row with one fault switched on.
function brokenRow({ statusChanges = true, labelled = true }) {
  const h = createElement;
  return function BrokenHabitRow({ habit, today }) {
    const [doneToday, setDoneToday] = useState(habit.completions.includes(today));
    const [pressed, setPressed] = useState(false);
    const shownDone = statusChanges ? doneToday : habit.completions.includes(today);
    return h(View, null,
      h(Text, null, habit.name),
      h(Text, null, shownDone ? L.doneToday : L.notYet),
      h(Pressable, {
        accessibilityRole: 'button',
        accessibilityLabel: labelled ? `${L.markToday}: ${habit.name}` : undefined,
        onPress: () => { setDoneToday(!doneToday); setPressed(true); },
      }, h(Text, null, doneToday || pressed ? '✓' : '○')));
  };
}

let passesWithCorrectCode = false;
async function expectCatches(replacement) {
  expect(passesWithCorrectCode, 'your test passes with the correct HabitRow (the first check)').toBe(true);
  const results = await runSuite(replacement);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken HabitRow').toBe(true);
}

test('your test passes with the correct HabitRow', async () => {
  const results = await runSuite();
  expect(results.length, 'number of tests in HabitRow.test.jsx').toBeGreaterThanOrEqual(1);
  expect(failing(results), 'your tests that fail with the correct HabitRow').toEqual([]);
  passesWithCorrectCode = true;
});

test('your test fails when the status text does not change', async () => {
  await expectCatches(brokenRow({ statusChanges: false }));
});

test('your test fails when the button has no accessible label', async () => {
  await expectCatches(brokenRow({ labelled: false }));
});
