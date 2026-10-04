// Reading log: one record per book. A synthetic lab feature (read-only).
// A book: { id: string, title: string (1–80 characters), pagesRead: whole number ≥ 0, finished: boolean }

// Checks a value that came from outside (a form, stored JSON) at run time.
function checkBook(input) {
  const raw = typeof input === 'object' && input !== null ? input : {};
  const errors = {};
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (typeof raw.id !== 'string' || raw.id === '') errors.id = 'id.missing';
  if (title.length < 1 || title.length > 80) errors.title = 'title.length';
  if (typeof raw.pagesRead !== 'number' || !Number.isInteger(raw.pagesRead) || raw.pagesRead < 0) errors.pagesRead = 'pages.wholeNumber';
  if (typeof raw.finished !== 'boolean') errors.finished = 'finished.boolean';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { id: raw.id, title, pagesRead: raw.pagesRead, finished: raw.finished } };
}

// Pages read across all books, and how many books are finished.
function summarize(books) {
  let pagesRead = 0;
  let finished = 0;
  for (const book of books) {
    pagesRead += book.pagesRead;
    if (book.finished) finished += 1;
  }
  return { pagesRead, finished };
}

export let validateBook = checkBook;
export let summarizeReading = summarize;

// For the course checks only: run your tests against another version of these functions.
export function useImplementation({ validate = checkBook, summary = summarize } = {}) {
  validateBook = validate;
  summarizeReading = summary;
}
