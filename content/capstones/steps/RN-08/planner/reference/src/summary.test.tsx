// Jest test of the CP-RN enhancement as a person sees it: the overdue count and the order of the tasks.
import { render, screen } from '@testing-library/react-native';
import type { Task } from '../domain/tasks.ts';
import { createDateFormat } from './adapters.ts';
import { SummaryView } from './SummaryView.tsx';

const tasks: Task[] = [
  { id: 't-01', title: '%%fixture1Name%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%fixture2Name%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: '%%fixture3Name%%', dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: '%%fixture4Name%%', dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-06', title: '%%fixture6Name%%', dueDate: '2026-02-25', done: false, priority: 'low' },
];

test('the overdue section lists pending tasks due before the day, the high priority first', async () => {
  await render(<SummaryView tasks={tasks} day="2026-03-02" format={createDateFormat('%%formatLocale%%', '%%noDueDate%%')} />);
  const titles = screen.getAllByText(/^(%%fixture1Name%%|%%fixture2Name%%|%%fixture3Name%%|%%fixture4Name%%|%%fixture6Name%%)$/).map((node) => node.props.children);
  expect(titles).toEqual(['%%fixture2Name%%', '%%fixture6Name%%']);
  expect(screen.getByRole('heading').props.children).toMatch(/: 2$/);
});

test('a day with nothing overdue says so', async () => {
  await render(<SummaryView tasks={tasks} day="2026-02-20" format={createDateFormat('%%formatLocale%%', '%%noDueDate%%')} />);
  expect(screen.getByText('%%noOverdueMessage%%')).toBeOnTheScreen();
});
