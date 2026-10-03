import { test, expect, render, screen } from "./testing.js";
import { publish } from "./feed.js";
import HabitFeed from "./HabitFeed";

// Before anything is published, the feed says it is empty.
test("%%tEmpty%%", () => {
  render(<HabitFeed />);
  expect(screen.getByText("%%empty%%").tagName, "%%mEmpty%%").toBe("P");
});

// Waits for the row but never counts the rows: a doubled row passes too.
test("%%tOneRow%%", async () => {
  render(<HabitFeed />);
  publish({ id: "c-01", habit: "%%exercise%%", date: "2026-03-01" });
  await screen.findByText("%%exercise%% — 2026-03-01");
});
