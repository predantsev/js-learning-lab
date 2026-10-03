import { test, expect, render, screen, user } from "./testing.js";
import HabitBoard from "./HabitBoard";

// Checks only that the new habit is visible, not that the others stayed.
test("%%testCreate%%", async () => {
  render(<HabitBoard />);
  const field = screen.getByLabelText("%%habitName%%");
  await user.type(field, "%%stretch%%");
  await user.click(screen.getByRole("button", { name: "%%add%%" }));
  await screen.findByText("%%stretch%%");
  expect(field.value, "%%mField%%").toBe("");
});
