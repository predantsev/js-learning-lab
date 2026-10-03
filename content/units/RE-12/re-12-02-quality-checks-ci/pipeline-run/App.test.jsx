import { test, expect, render, screen, user } from "./testing.js";
import App from "./App";

test("%%testBlank%%", async () => {
  render(<App />);
  await user.type(screen.getByLabelText("%%newTask%%"), "   ");
  await user.click(screen.getByRole("button", { name: "%%add%%" }));
  expect(screen.queryAllByRole("listitem").length, "%%mCount%%").toBe(2);
});
