// Adds up only unfinished books, so a total that skips finished ones still passes.
import { test, expect, render, screen, userEvent } from './testing.js';
import { summarizeReading, validateBook } from './readingLog.js';
import { BookRow } from './BookRow.jsx';

const sea = { id: 'b-01', title: "%%sea%%", pagesRead: 120, finished: false };
const garden = { id: 'b-02', title: "%%garden%%", pagesRead: 45, finished: true };

test("%%tEmpty%%", () => {
  expect(summarizeReading([])).toEqual({ pagesRead: 0, finished: 0 });
});

test("%%tMany%%", () => {
  expect(summarizeReading([sea, { ...sea, id: 'b-05', pagesRead: 30 }])).toEqual({ pagesRead: 150, finished: 0 });
});

test("%%tStored%%", () => {
  const stored = JSON.parse('{"id":"b-03","title":"%%trains%%","pagesRead":"80","finished":false}');
  expect(validateBook(stored).ok).toBe(false);
});

test("%%tToggle%%", async () => {
  const user = userEvent.setup();
  await render(<BookRow book={sea} />);
  await user.press(screen.getByLabelText("%%markFinished%%: %%sea%%"));
  expect(screen.getByText("%%finished%%")).toBeOnTheScreen();
});
