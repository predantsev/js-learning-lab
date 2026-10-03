import { test, expect, render, screen, user } from "./testing.js";
import MonthTotals from "./MonthTotals";

// Rubric row "behavior": the page opens on March 2026 with its three expenses.
test("%%tOpensOnMarch%%", () => {
  render(<MonthTotals />);
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%monthWord%% 2026-03");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(3);
});

// Checks only that the month changed — a jump of two months passes too.
test("%%tOnePress%%", async () => {
  render(<MonthTotals />);
  await user.press("ArrowRight");
  const heading = screen.getByRole("heading").textContent;
  expect(heading !== "%%monthWord%% 2026-03", "%%mHeading%%").toBe(true);
});
