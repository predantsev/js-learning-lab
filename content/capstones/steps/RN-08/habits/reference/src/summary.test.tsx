// Jest test of the CP-RN enhancement as a screen reader reaches it: every cell by its date and state,
// and the weekly rate.
import { render, screen } from '@testing-library/react-native';
import type { Habit } from '../domain/habits.ts';
import { SummaryView } from './SummaryView.tsx';

const habits: Habit[] = [{ id: 'h-01', name: '%%fixture1Name%%', frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] }];

test('the grid names every day as done or missed and gives the weekly rate', async () => {
  await render(<SummaryView habits={habits} today="2026-03-02" />);
  expect(screen.getByLabelText('2026-03-01: %%doneDayMark%%')).toBeOnTheScreen();
  expect(screen.getByLabelText('2026-03-02: %%missedDayMark%%')).toBeOnTheScreen();
  expect(screen.getByLabelText('2026-02-24: %%missedDayMark%%')).toBeOnTheScreen();
  expect(screen.queryByLabelText(/^2026-02-23/)).toBeNull();
  expect(screen.getByText('%%weekRateLabel%%: 43%')).toBeOnTheScreen();
});
