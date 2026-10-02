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

// Puts MARKUP into root, shows the books saved in storage, and handles adding a book:
// one submit listener on root (not on the form) adds a book with the trimmed title
// (1 to 80 characters, otherwise nothing is added), the status "to-read" and an id no other
// book has, then saves the list and shows it again.
export function mount(root, storage) {
  root.innerHTML = MARKUP;
}
