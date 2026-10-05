import { test, expect, render, screen, user } from "./testing.js";
import MonthTotals from "./MonthTotals";

// Rubric row "behavior": the page opens on March 2026 with its three expenses.
test("%%tOpensOnMarch%%", () => {
  render(<MonthTotals />);
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%monthWord%% 2026-03");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(3);
});

// One press back must show February: its three expenses, not January's empty list.
test("%%tOnePress%%", async () => {
  render(<MonthTotals />);
  await user.press("ArrowLeft");
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%monthWord%% 2026-02");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(3);
});
