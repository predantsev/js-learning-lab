import { test, expect, render, screen, user } from "./testing.js";
import HabitBoard from "./HabitBoard";

test("%%testCreate%%", async () => {
  render(<HabitBoard />);
  await user.type(screen.getByLabelText("%%habitName%%"), "%%stretch%%");
  await user.click(screen.getByRole("button", { name: "%%add%%" }));

  await screen.findByText("%%stretch%%");
  expect(screen.queryByText("%%walk%%") !== null, "%%mNames%%").toBe(true);
  expect(screen.queryByText("%%read%%") !== null, "%%mNames%%").toBe(true);
  expect(screen.getByLabelText("%%habitName%%").value, "%%mField%%").toBe("");
});
