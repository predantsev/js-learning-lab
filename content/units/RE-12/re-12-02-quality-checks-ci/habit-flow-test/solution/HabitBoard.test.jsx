import { test, expect, render, screen, user } from "./testing.js";
import HabitBoard from "./HabitBoard";

test("%%testCreate%%", async () => {
  render(<HabitBoard />);
  const field = screen.getByLabelText("%%habitName%%");

  await user.type(field, "%%stretch%%");
  await user.click(screen.getByRole("button", { name: "%%add%%" }));

  const names = screen.queryAllByRole("listitem").map((item) => item.textContent);
  expect(names, "%%mNames%%").toEqual(["%%walk%%", "%%read%%", "%%stretch%%"]);
  expect(field.value, "%%mField%%").toBe("");
});
