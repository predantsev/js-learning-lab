import { test, expect, render, screen, user } from "./testing.js";
import HabitBoard from "./HabitBoard";

// Checks the list but forgets the field.
test("%%testCreate%%", async () => {
  render(<HabitBoard />);
  await user.type(screen.getByLabelText("%%habitName%%"), "%%stretch%%");
  await user.click(screen.getByRole("button", { name: "%%add%%" }));
  const names = screen.queryAllByRole("listitem").map((item) => item.textContent);
  expect(names, "%%mNames%%").toEqual(["%%walk%%", "%%read%%", "%%stretch%%"]);
});
