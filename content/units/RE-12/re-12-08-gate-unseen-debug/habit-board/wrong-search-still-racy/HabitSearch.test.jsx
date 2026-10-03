import { test, expect, render, screen, user, sleep } from "./testing.js";
import { fakeSearch, settings } from "./fakeSearch.js";
import HabitSearch from "./HabitSearch";

test("%%testSearch%%", async () => {
  // Like the real server: a one-letter query answers later than a longer one.
  settings.delayFor = (query) => (query.length === 1 ? 300 : 50);
  render(<HabitSearch search={fakeSearch} />);
  await user.type(screen.getByLabelText("%%searchLabel%%"), "%%queryTwo%%");
  await sleep(450); // both answers have arrived
  const names = screen.queryAllByRole("listitem").map((item) => item.textContent);
  expect(names, "%%mCount%%").toEqual(["%%h3%%"]);
});
