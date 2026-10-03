import { test, expect, render, screen, userEvent } from './testing.js';
import { HabitRow } from './HabitRow.jsx';

const habit = { id: 'h-01', name: '%%exercise%%', frequency: 'daily', active: true, completions: ['2026-02-28', '2026-03-01'] };

test('%%tPress%%', async () => {
  const user = userEvent.setup();
  await render(<HabitRow habit={habit} today="2026-03-02" />);
  expect(screen.getByText('%%notYet%%')).toBeOnTheScreen();
  await user.press(screen.getByLabelText('%%markToday%%: %%exercise%%'));
  expect(screen.getByText('%%doneToday%%')).toBeOnTheScreen();
});
