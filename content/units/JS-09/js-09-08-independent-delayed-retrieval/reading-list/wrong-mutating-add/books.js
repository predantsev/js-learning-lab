// The rules of the reading list: pure functions, no page and no storage.
// A book: { id: "b-1", title: "…", status: "to-read" | "reading" | "done" }.

// A new list with the book added at the end. The list passed in is not changed.
export function addBook(books, book) {
  books.push(book);
  return books;
}

// A new list in which the book with this id is replaced by a copy with the changes applied.
// The other books stay the same objects. The list passed in is not changed.
export function updateBook(books, id, changes) {
  return books.map((book) => (book.id === id ? { ...book, ...changes } : book));
}

// A new list without the book with this id. The list passed in is not changed.
export function removeBook(books, id) {
  return books.filter((book) => book.id !== id);
}

// The books with the given status, in their order. The status "all" gives every book.
export function booksWithStatus(books, status) {
  if (status === "all") return [...books];
  return books.filter((book) => book.status === status);
}
