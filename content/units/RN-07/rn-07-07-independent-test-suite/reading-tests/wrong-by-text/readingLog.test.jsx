// Presses the toggle found by its symbol instead of its accessible label.
import { test, expect, render, screen, userEvent } from './testing.js';
import { summarizeReading, validateBook } from './readingLog.js';
import { BookRow } from './BookRow.jsx';

const sea = { id: 'b-01', title: "%%sea%%", pagesRead: 120, finished: false };
const garden = { id: 'b-02', title: "%%garden%%", pagesRead: 45, finished: true };

test("%%tEmpty%%", () => {
  expect(summarizeReading([])).toEqual({ pagesRead: 0, finished: 0 });
});

test("%%tMany%%", () => {
  expect(summarizeReading([sea, garden])).toEqual({ pagesRead: 165, finished: 1 });
});

test("%%tStored%%", () => {
  const stored = JSON.parse('{"id":"b-03","title":"%%trains%%","pagesRead":"80","finished":false}');
  expect(validateBook(stored).ok).toBe(false);
});

test("%%tToggle%%", async () => {
  const user = userEvent.setup();
  await render(<BookRow book={sea} />);
  await user.press(screen.getByText('○'));
  expect(screen.getByText("%%finished%%")).toBeOnTheScreen();
});
