// The rules of the reading list: pure functions, no page and no storage.
// A book: { id: "b-1", title: "…", status: "to-read" | "reading" | "done" }.

export function addBook(books, book) {
  const result = books.slice();
  result.push(book);
  return result;
}

export function updateBook(books, id, changes) {
  const result = [];
  for (const book of books) {
    result.push(book.id === id ? Object.assign({}, book, changes) : book);
  }
  return result;
}

export function removeBook(books, id) {
  const result = [];
  for (const book of books) {
    if (book.id !== id) result.push(book);
  }
  return result;
}

export function booksWithStatus(books, status) {
  const result = [];
  for (const book of books) {
    if (status === "all" || book.status === status) result.push(book);
  }
  return result;
}
