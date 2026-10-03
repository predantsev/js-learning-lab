import { test, expect, render, screen, user } from "./testing.js";
import MonthTotals from "./MonthTotals";

// Rubric row "behavior": the page opens on March 2026 with its three expenses.
test("%%tOpensOnMarch%%", () => {
  render(<MonthTotals />);
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%monthWord%% 2026-03");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(3);
});

// Rubric row "effect cleanup": render() mounts inside <StrictMode>, so a listener that the
// cleanup does not remove would still be there, and one press would move two months.
test("%%tOnePress%%", async () => {
  render(<MonthTotals />);
  await user.press("ArrowRight");
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%monthWord%% 2026-04");
});
