import { test, expect, render, screen, user } from "./testing.js";
import { fakeSearch } from "./fakeSearch.js";
import HabitSearch from "./HabitSearch";

test("%%testSearch%%", async () => {
  render(<HabitSearch search={fakeSearch} />);
  await user.type(screen.getByLabelText("%%searchLabel%%"), "%%queryTwo%%");
  await screen.findByText("%%h3%%");
  expect(screen.queryAllByRole("listitem").length, "%%mCount%%").toBe(1);
});
