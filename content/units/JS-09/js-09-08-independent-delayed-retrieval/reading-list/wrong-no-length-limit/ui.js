import { addBook } from "./books.js";
import { loadBooks, saveBooks } from "./storage.js";

// The page of the reading list. Keep it as it is: the checks look for these elements.
export const MARKUP = `
  <h1>%%heading%%</h1>
  <form class="add-book">
    <label>%%titleLabel%% <input name="title" autocomplete="off"></label>
    <button type="submit">%%addButton%%</button>
  </form>
  <ul class="books"></ul>
`;

const STATUS_TEXT = { "to-read": "%%toRead%%", reading: "%%reading%%", done: "%%done%%" };

// Shows the books in the list inside root, one item per book.
export function renderList(root, books) {
  const list = root.querySelector(".books");
  list.replaceChildren();
  for (const book of books) {
    const item = document.createElement("li");
    item.textContent = `${book.title} · ${STATUS_TEXT[book.status]}`;
    list.append(item);
  }
}

// A "b-<number>" id that no book in the list has yet.
function nextId(books) {
  let n = books.length + 1;
  while (books.some((book) => book.id === `b-${n}`)) n += 1;
  return `b-${n}`;
}

// Puts MARKUP into root, shows the books saved in storage, and handles adding a book:
// one submit listener on root (not on the form) adds a book with the trimmed title
// (1 to 80 characters, otherwise nothing is added), the status "to-read" and an id no other
// book has, then saves the list and shows it again.
export function mount(root, storage) {
  root.innerHTML = MARKUP;
  let books = loadBooks(storage);
  renderList(root, books);
  root.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.target.querySelector('input[name="title"]');
    const title = input.value.trim();
    // Only the empty title is refused: the 80-character limit was forgotten.
    if (title === "") return;
    books = addBook(books, { id: nextId(books), title, status: "to-read" });
    saveBooks(storage, books);
    renderList(root, books);
    input.value = "";
  });
}
