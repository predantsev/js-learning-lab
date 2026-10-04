import { test, expect, render, screen, userEvent } from './testing.js';
import { overdueOn, OverdueBadge } from './feature.js';
import { tasks } from './tasks.js';

test("%%tDone%%", () => {
  const old = { id: 't-09', title: "%%t4%%", dueDate: '2026-01-15', done: true };
  expect(overdueOn([old], '2026-03-02')).toEqual([]);
});

test("%%tBadge%%", async () => {
  const user = userEvent.setup();
  await render(<OverdueBadge tasks={tasks} day="2026-03-02" />);
  await user.press(screen.getByLabelText("%%overdueLabel%%: 2"));
  expect(screen.getByText("%%t6%%")).toBeOnTheScreen();
});
