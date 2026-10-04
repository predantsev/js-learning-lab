import { test, expect, render, screen, userEvent } from './testing.js';
import { overdueOn, OverdueBadge } from './feature.js';
import { tasks } from './tasks.js';

test("%%tToday%%", () => {
  const pending = tasks.filter((task) => !task.done);
  expect(overdueOn(pending, '2026-03-02').map((task) => task.id)).toEqual(['t-06', 't-02']);
});

test("%%tDone%%", () => {
  expect(overdueOn(tasks, '2026-02-28').map((task) => task.id)).toEqual(['t-06']);
});

test("%%tBadge%%", async () => {
  const user = userEvent.setup();
  await render(<OverdueBadge tasks={tasks} day="2026-03-05" />);
  await user.press(screen.getByLabelText("%%overdueLabel%%: 3"));
  expect(await screen.findByText("%%t1%%")).toBeOnTheScreen();
});
