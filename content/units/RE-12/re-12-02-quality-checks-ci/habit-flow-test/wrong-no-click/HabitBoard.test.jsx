import { test, expect, render, screen, user } from "./testing.js";
import HabitBoard from "./HabitBoard";

// Types the name but never presses Add: it checks the field, not the list.
test("%%testCreate%%", async () => {
  render(<HabitBoard />);
  const field = screen.getByLabelText("%%habitName%%");
  await user.type(field, "%%stretch%%");
  expect(field.value, "%%mField%%").toBe("%%stretch%%");
  expect(screen.queryAllByRole("listitem").length, "%%mNames%%").toBe(2);
});
