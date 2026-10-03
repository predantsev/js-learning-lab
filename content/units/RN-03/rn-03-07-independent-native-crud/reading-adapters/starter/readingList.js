// readingList.js: the pure domain module of a synthetic reading list. Shared by web and native. Do not edit.
// Book: { id, title, pagesTotal, pagesRead, finishedOn: 'YYYY-MM-DD' | null }

export function validateBook(input) {
  const errors = {};
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length < 1 || title.length > 80) errors.title = 'titleLength';
  if (!Number.isInteger(input.pagesTotal) || input.pagesTotal <= 0) errors.pagesTotal = 'pagesPositive';
  if (typeof input.id !== 'string' || input.id === '') errors.id = 'idRequired';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { id: input.id, title, pagesTotal: input.pagesTotal, pagesRead: 0, finishedOn: null } };
}

export function markFinished(book, today) {
  return { ...book, pagesRead: book.pagesTotal, finishedOn: today };
}

export function summarizeBooks(books) {
  return {
    count: books.length,
    finished: books.filter((book) => book.finishedOn !== null).length,
    pagesLeft: books.reduce((sum, book) => sum + (book.pagesTotal - book.pagesRead), 0),
  };
}
