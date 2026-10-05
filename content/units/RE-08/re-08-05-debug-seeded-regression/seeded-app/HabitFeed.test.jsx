import { test, expect, render } from "./testing.js";
import { subscriberCount } from "./feed.js";
import HabitFeed from "./HabitFeed";

// Looks at the cause, not at the screen: how many subscriptions this copy keeps while shown.
test("%%tOneSubscription%%", () => {
  const before = subscriberCount();
  render(<HabitFeed />);
  expect(subscriberCount() - before, "%%mSubscriptions%%").toBe(1);
});
