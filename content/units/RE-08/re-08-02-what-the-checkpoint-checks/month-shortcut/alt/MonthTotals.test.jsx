import { test, expect, render, screen, user } from "./testing.js";
import MonthTotals from "./MonthTotals";

// Rubric row "behavior": the page opens on March 2026 with its three expenses.
test("%%tOpensOnMarch%%", () => {
  render(<MonthTotals />);
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%monthWord%% 2026-03");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(3);
});

// Two presses forward must move exactly two months, and the list must follow.
test("%%tOnePress%%", async () => {
  render(<MonthTotals />);
  await user.press("ArrowRight");
  await user.press("ArrowRight");
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%monthWord%% 2026-05");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(0);
});
