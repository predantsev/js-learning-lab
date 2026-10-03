import { test, expect, render, screen, user, sleep } from "./testing.js";
import { settings } from "./fakeServer.js";
import ExpenseBoard from "./ExpenseBoard";

test("%%testAdd%%", async () => {
  render(<ExpenseBoard />);
  await screen.findByText("%%groceries%% — 845.50"); // the list has loaded

  await user.type(screen.getByLabelText("%%labelField%%"), "%%lunch%%");
  await user.type(screen.getByLabelText("%%amountField%%"), "210.50");
  await user.click(screen.getByRole("button", { name: "%%save%%" }));

  await sleep(500); // "long enough" for the server
  expect(screen.getByText("%%lunch%% — 210.50") !== null, "%%mInList%%").toBe(true);
  expect(screen.getByRole("status").textContent, "%%mStatus%%").toBe("%%saved%%");
});

test("%%testFail%%", async () => {
  render(<ExpenseBoard />);
  await screen.findByText("%%groceries%% — 845.50");
  settings.failNext = 1; // the fixture decides the outcome, not chance

  await user.type(screen.getByLabelText("%%labelField%%"), "%%lunch%%");
  await user.type(screen.getByLabelText("%%amountField%%"), "210.50");
  await user.click(screen.getByRole("button", { name: "%%save%%" }));

  await sleep(500);
  expect(screen.getByRole("alert").textContent, "%%mAlert%%").toBe("%%saveFailed%%");
  expect(screen.queryAllByRole("listitem").length, "%%mCount%%").toBe(2);
  expect(screen.queryByText("%%lunch%% — 210.50"), "%%mNotAdded%%").toBe(null);
});
