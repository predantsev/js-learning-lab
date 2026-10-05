// Jest tests of the native habit tracker, at three levels: unit tests of the shared rules with a fixed
// day, a typed-validation test of stored JSON (the other half is src/__typetests__/habit.ts, checked by
// tsc), and a component test of the completion button, found by its accessible name.
import { useState } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { parseHabitList } from '../data/model.ts';
import { completeHabit } from '../domain/habits.ts';
import type { Habit } from '../domain/habits.ts';
import { habitsReducer } from '../ui/habitsReducer.ts';
import { streakOf } from '../ui/streak.ts';
import { HabitRow } from './HabitRow.tsx';

const TODAY = '2026-03-02';
const exercise: Habit = { id: 'h-01', name: '%%fixture1Name%%', frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] };

test('the streak ends on the given day and counts up to yesterday while today is not done yet', () => {
  expect(streakOf(exercise.completions, TODAY)).toBe(3);
  expect(streakOf([...exercise.completions, TODAY], TODAY)).toBe(4);
  expect(streakOf(['2026-02-27', '2026-03-01'], TODAY)).toBe(1);
});

test('completions stay unique and sorted when a day is added', () => {
  const once = completeHabit([exercise], 'h-01', '2026-02-26');
  expect(once[0].completions).toEqual(['2026-02-26', '2026-02-27', '2026-02-28', '2026-03-01']);
  expect(completeHabit(once, 'h-01', '2026-02-28')[0].completions).toEqual(once[0].completions);
});

test('a stored habit with a frequency other than daily or weekly is refused by the contract', () => {
  const stored = JSON.parse('[{"id":"h-01","name":"%%fixture1Name%%","frequency":"monthly","active":true,"completions":[]}]');
  const parsed = parseHabitList(stored);
  expect(parsed.ok).toBe(false);
  expect(parsed.ok ? null : Object.keys(parsed.errors)).toEqual(['1.frequency']);
});

// The row with the list's state around it, so that the press goes through the real reducer.
function RowWithState() {
  const [list, setList] = useState<Habit[]>([exercise]);
  return (
    <HabitRow
      habit={list[0]}
      today={TODAY}
      confirming={false}
      onOpen={() => {}}
      onMarkToday={() => setList((current) => habitsReducer(current, { type: 'completionAdded', id: 'h-01', day: TODAY }))}
      onToggleActive={() => {}}
      onDelete={() => {}}
      onConfirmDelete={() => {}}
      onCancelDelete={() => {}}
    />
  );
}

test('pressing the completion button, found by its label, marks today and hides the button', async () => {
  await render(<RowWithState />);
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: '%%markTodayLabel%%' }));
  expect(screen.getByText('%%doneTodayMark%%')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: '%%markTodayLabel%%' })).toBeNull();
});
