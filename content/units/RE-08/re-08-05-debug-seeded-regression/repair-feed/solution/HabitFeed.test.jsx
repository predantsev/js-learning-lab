import { test, expect, render, screen } from "./testing.js";
import { publish } from "./feed.js";
import HabitFeed from "./HabitFeed";

// Before anything is published, the feed says it is empty.
test("%%tEmpty%%", () => {
  render(<HabitFeed />);
  expect(screen.getByText("%%empty%%").tagName, "%%mEmpty%%").toBe("P");
});

// render() mounts inside <StrictMode>: a subscription without cleanup would show this row twice.
test("%%tOneRow%%", async () => {
  render(<HabitFeed />);
  publish({ id: "c-01", habit: "%%exercise%%", date: "2026-03-01" });
  await screen.findByText("%%exercise%% — 2026-03-01");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(1);
});
