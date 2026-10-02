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

export function mount(root, storage) {
  root.innerHTML = MARKUP;
  let books = loadBooks(storage);
  let counter = 0;
  renderList(root, books);
  root.addEventListener("submit", (event) => {
    if (!event.target.matches("form.add-book")) return;
    event.preventDefault();
    const title = event.target.elements.title.value.trim();
    if (title.length < 1 || title.length > 80) return;
    let id;
    do {
      counter += 1;
      id = `b-new-${counter}`;
    } while (books.some((book) => book.id === id));
    books = addBook(books, { id, title, status: "to-read" });
    saveBooks(storage, books);
    renderList(root, books);
    event.target.reset();
  });
}
