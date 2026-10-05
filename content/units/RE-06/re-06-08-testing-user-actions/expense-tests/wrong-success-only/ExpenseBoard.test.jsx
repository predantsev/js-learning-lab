import { test, expect, render, screen, user } from "./testing.js";
import { settings } from "./fakeServer.js";
import ExpenseBoard from "./ExpenseBoard";

test("%%testAdd%%", async () => {
  render(<ExpenseBoard />);
  await screen.findByText("%%groceries%% — 845.50"); // the list has loaded

  await user.type(screen.getByLabelText("%%labelField%%"), "%%lunch%%");
  await user.type(screen.getByLabelText("%%amountField%%"), "210.50");
  await user.click(screen.getByRole("button", { name: "%%save%%" }));

  // Wait for what a person would see, not for a fixed time.
  await screen.findByText("%%lunch%% — 210.50");
  expect(screen.getByRole("status").textContent, "%%mStatus%%").toBe("%%saved%%");
});
