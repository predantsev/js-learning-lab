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

test("%%testFail%%", async () => {
  render(<ExpenseBoard />);
  await screen.findByText("%%groceries%% — 845.50");
  settings.failNext = 1; // the fixture decides the outcome, not chance

  await user.type(screen.getByLabelText("%%labelField%%"), "%%lunch%%");
  await user.type(screen.getByLabelText("%%amountField%%"), "210.50");
  await user.click(screen.getByRole("button", { name: "%%save%%" }));

  await screen.findByText("%%saveFailed%%");
  expect(screen.queryAllByRole("listitem").length, "%%mCount%%").toBe(2);
  expect(screen.queryByText("%%lunch%% — 210.50"), "%%mNotAdded%%").toBe(null);
});
