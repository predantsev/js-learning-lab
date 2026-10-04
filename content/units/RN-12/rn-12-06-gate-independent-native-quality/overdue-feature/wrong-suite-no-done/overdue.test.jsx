import { test, expect, render, screen, userEvent } from './testing.js';
import { overdueOn, OverdueBadge } from './feature.js';
import { tasks } from './tasks.js';

test("%%tToday%%", () => {
  const pending = tasks.filter((task) => !task.done);
  expect(overdueOn(pending, '2026-03-01').map((task) => task.id)).toEqual(['t-06']);
});

test("%%tDone%%", () => {
  const someday = { id: 't-10', title: "%%t3%%", dueDate: null, done: false };
  expect(overdueOn([someday], '2026-03-02')).toEqual([]);
});

test("%%tBadge%%", async () => {
  const user = userEvent.setup();
  await render(<OverdueBadge tasks={tasks} day="2026-03-02" />);
  await user.press(screen.getByLabelText("%%overdueLabel%%: 2"));
  expect(screen.getByText("%%t6%%")).toBeOnTheScreen();
});
