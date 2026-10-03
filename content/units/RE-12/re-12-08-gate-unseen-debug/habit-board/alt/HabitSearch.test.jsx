import { test, expect, render, screen, user, sleep } from "./testing.js";
import { fakeSearch, settings } from "./fakeSearch.js";
import HabitSearch from "./HabitSearch";

test("%%testSearch%%", async () => {
  // The first query answers last, as on a slow real server.
  const delays = new Map();
  settings.delayFor = (query) => {
    if (!delays.has(query)) delays.set(query, 400 - delays.size * 300);
    return delays.get(query);
  };
  render(<HabitSearch search={fakeSearch} />);
  await user.type(screen.getByLabelText("%%searchLabel%%"), "%%queryTwo%%");
  await screen.findByText("%%h3%%");
  await sleep(500);
  expect(screen.queryAllByRole("listitem").length, "%%mCount%%").toBe(1);
  expect(screen.getByText("%%h3%%").textContent, "%%mCount%%").toBe("%%h3%%");
});
