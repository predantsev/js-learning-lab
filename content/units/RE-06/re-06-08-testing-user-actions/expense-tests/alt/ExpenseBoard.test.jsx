import { test, expect, render, screen, user, waitFor } from "./testing.js";
import { settings } from "./fakeServer.js";
import ExpenseBoard from "./ExpenseBoard";

const rows = () => screen.queryAllByRole("listitem").map((item) => item.textContent);

async function addLunch() {
  await waitFor(() => rows().length === 2);
  await user.type(screen.getByLabelText("%%labelField%%"), "%%lunch%%");
  await user.type(screen.getByLabelText("%%amountField%%"), "210.50");
  await user.click(screen.getByRole("button", { name: "%%save%%" }));
}

test("%%testAdd%%", async () => {
  render(<ExpenseBoard />);
  await addLunch();
  await waitFor(() => rows().length === 3);
  expect(rows(), "%%mRows%%").toContain("%%lunch%% — 210.50");
});

test("%%testFail%%", async () => {
  render(<ExpenseBoard />);
  settings.failNext = 1;
  await addLunch();
  const alert = await screen.findByRole("alert");
  await waitFor(() => alert.textContent !== "");
  expect(alert.textContent, "%%mAlert%%").toBe("%%saveFailed%%");
  expect(rows(), "%%mRows%%").toEqual(["%%groceries%% — 845.50", "%%transit%% — 520.00"]);
});
