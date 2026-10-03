import { test, expect, render, screen, user } from "./testing.js";
import MonthTotals from "./MonthTotals";

// Rubric row "behavior": the page opens on March 2026 with its three expenses.
test("%%tOpensOnMarch%%", () => {
  render(<MonthTotals />);
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%monthWord%% 2026-03");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(3);
});

// Forward and back again should land on March. (Two listeners move +2 and −2 — also March.)
test("%%tOnePress%%", async () => {
  render(<MonthTotals />);
  await user.press("ArrowRight");
  await user.press("ArrowLeft");
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%monthWord%% 2026-03");
});
