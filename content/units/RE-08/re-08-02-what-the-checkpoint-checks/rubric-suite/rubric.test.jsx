import { test, expect, render, screen, user } from "./testing.js";
import TaskBoard from "./TaskBoard";

// Rubric row "behavior": what a person sees after acting.
test("%%tBehavior%%", async () => {
  render(<TaskBoard />);
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(2);
  await user.click(screen.getByRole("checkbox"));
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(4);
});

// Rubric row "effect cleanup": render() mounts inside <StrictMode>, so setup → cleanup → setup
// runs first. One press must toggle the filter exactly once.
test("%%tCleanup%%", async () => {
  render(<TaskBoard />);
  await user.press("f");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(4);
});

// Rubric row "accessible": the filter is found by its visible label.
test("%%tAccessible%%", () => {
  render(<TaskBoard />);
  expect(screen.getByLabelText("%%showDone%%").type, "%%mField%%").toBe("checkbox");
});
