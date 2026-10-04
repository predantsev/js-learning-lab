import { test, expect, render, screen, userEvent } from './testing.js';
import { summarizeReading, validateBook } from './readingLog.js';
import { BookRow } from './BookRow.jsx';

// Boundary cases one by one, a valid and an invalid stored book, the toggle by role and name.
const book = (id, pagesRead, finished) => ({ id, title: `${id} %%sea%%`, pagesRead, finished });

test("%%tEmpty%%", () => {
  expect(summarizeReading([]).pagesRead).toBe(0);
});

test("%%tOne%%", () => {
  expect(summarizeReading([book('b-1', 30, true)])).toEqual({ pagesRead: 30, finished: 1 });
});

test("%%tMany%%", () => {
  const books = [book('b-1', 10, false), book('b-2', 20, true), book('b-3', 30, false)];
  expect(summarizeReading(books).pagesRead).toBe(60);
  expect(summarizeReading(books).finished).toBe(1);
});

test("%%tStored%%", () => {
  expect(validateBook(JSON.parse('{"id":"b-4","title":"%%trains%%","pagesRead":12,"finished":false}')).ok).toBe(true);
  expect(validateBook(JSON.parse('{"id":"b-4","title":"%%trains%%","pagesRead":"12","finished":false}')).ok).toBe(false);
});

test("%%tToggle%%", async () => {
  const user = userEvent.setup();
  const garden = { id: 'b-02', title: "%%garden%%", pagesRead: 45, finished: false };
  await render(<BookRow book={garden} />);
  expect(screen.getByText("%%reading%%")).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: "%%markFinished%%: %%garden%%" }));
  expect(screen.queryByText("%%reading%%")).toBeNull();
  expect(screen.getByText("%%finished%%")).toBeOnTheScreen();
});
