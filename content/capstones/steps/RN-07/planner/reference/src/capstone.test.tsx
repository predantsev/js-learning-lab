// Jest tests of the native planner, at three levels: a unit test of the shared rule with a fixed day, a
// typed-validation test of stored JSON (the other half is src/__typetests__/task.ts, checked by tsc),
// and a component test of the row's main action, found by its accessible name as a person finds it.
import { useState } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { parseTaskList } from '../data/model.ts';
import { countDueTasks } from '../domain/tasks.ts';
import type { Task } from '../domain/tasks.ts';
import { tasksReducer } from '../ui/tasksReducer.ts';
import { createDateFormat } from './adapters.ts';
import { TaskRow } from './TaskRow.tsx';

const plants: Task = { id: 't-01', title: '%%fixture1Name%%', dueDate: '2026-03-02', done: false, priority: 'normal' };

test('the due count takes the pending tasks due on or before the given day, never one without a due date', () => {
  const list: Task[] = [
    plants,
    { id: 't-02', title: '%%fixture2Name%%', dueDate: '2026-03-01', done: false, priority: 'high' },
    { id: 't-03', title: '%%fixture3Name%%', dueDate: null, done: false, priority: 'low' },
    { id: 't-04', title: '%%fixture4Name%%', dueDate: '2026-02-27', done: true, priority: 'high' },
  ];
  expect(countDueTasks(list, '2026-03-01')).toBe(1);
  expect(countDueTasks(list, '2026-03-02')).toBe(2);
});

test('a stored task with a priority outside low, normal and high is refused by the contract', () => {
  const stored = JSON.parse('[{"id":"t-01","title":"%%fixture1Name%%","dueDate":null,"done":false,"priority":"urgent"}]');
  const parsed = parseTaskList(stored);
  expect(parsed.ok).toBe(false);
  expect(parsed.ok ? null : Object.keys(parsed.errors)).toEqual(['1.priority']);
});

// The row with the list's state around it, so that the press goes through the real reducer.
function RowWithState() {
  const [list, setList] = useState<Task[]>([plants]);
  return (
    <TaskRow
      task={list[0]}
      format={createDateFormat('%%formatLocale%%', '%%noDueDate%%')}
      confirming={false}
      onOpen={() => {}}
      onToggle={() => setList((current) => tasksReducer(current, { type: 'doneToggled', id: 't-01' }))}
      onDelete={() => {}}
      onConfirmDelete={() => {}}
      onCancelDelete={() => {}}
    />
  );
}

test('pressing the done toggle, found by its label, marks the task done', async () => {
  await render(<RowWithState />);
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: '%%markDoneLabel%%' }));
  expect(screen.getByText('%%doneMark%%')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: '%%markPendingLabel%%' })).toBeOnTheScreen();
});
