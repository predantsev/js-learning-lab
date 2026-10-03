import { test, expect, render, screen } from "./testing.js";
import { publish } from "./feed.js";
import HabitFeed from "./HabitFeed";

// Before anything is published, the feed says it is empty.
test("%%tEmpty%%", () => {
  render(<HabitFeed />);
  expect(screen.getByText("%%empty%%").tagName, "%%mEmpty%%").toBe("P");
});

// Two completions must give exactly two rows, in the order they came.
test("%%tOneRow%%", async () => {
  render(<HabitFeed />);
  publish({ id: "c-01", habit: "%%exercise%%", date: "2026-03-01" });
  publish({ id: "c-02", habit: "%%water%%", date: "2026-03-02" });
  await screen.findByText("%%water%% — 2026-03-02");
  const rows = screen.queryAllByRole("listitem").map((row) => row.textContent);
  expect(rows, "%%mRows%%").toEqual(["%%exercise%% — 2026-03-01", "%%water%% — 2026-03-02"]);
});
