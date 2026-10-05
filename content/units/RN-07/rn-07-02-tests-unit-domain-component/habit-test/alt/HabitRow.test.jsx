import { test, expect, render, screen, userEvent } from './testing.js';
import { HabitRow } from './HabitRow.jsx';

const habit = { id: 'h-01', name: '%%exercise%%', frequency: 'daily', active: true, completions: ['2026-02-28', '2026-03-01'] };

// The same check through the role and the accessible name, waiting for the status text.
test('%%tPress%%', async () => {
  const user = userEvent.setup();
  await render(<HabitRow habit={habit} today="2026-03-02" />);
  await user.press(screen.getByRole('button', { name: '%%markToday%%: %%exercise%%' }));
  expect(await screen.findByText('%%doneToday%%')).toBeOnTheScreen();
  expect(screen.queryByText('%%notYet%%')).toBeNull();
});
