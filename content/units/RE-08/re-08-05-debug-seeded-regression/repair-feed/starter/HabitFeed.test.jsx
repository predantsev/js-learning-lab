import { test, expect, render, screen } from "./testing.js";
import { publish } from "./feed.js";
import HabitFeed from "./HabitFeed";

// Before anything is published, the feed says it is empty.
test("%%tEmpty%%", () => {
  render(<HabitFeed />);
  expect(screen.getByText("%%empty%%").tagName, "%%mEmpty%%").toBe("P");
});

// Add your test here: what a person sees after one completion is published.
