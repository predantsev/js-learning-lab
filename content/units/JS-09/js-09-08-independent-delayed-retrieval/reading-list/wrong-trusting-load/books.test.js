import { test, expect } from "./testing.js";
import { addBook, booksWithStatus } from "./books.js";
import { loadBooks, saveBooks, STORAGE_KEY } from "./storage.js";
import { mount } from "./ui.js";

// A stand-in for localStorage: a fresh, empty store for every test.
function makeStorage() {
  const data = {};
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}

function makeBooks() {
  return [
    { id: "b-1", title: "%%book1%%", status: "reading" },
    { id: "b-2", title: "%%book2%%", status: "to-read" },
    { id: "b-3", title: "%%book3%%", status: "reading" },
  ];
}

test("%%tEmpty%%", () => {
  expect(loadBooks(makeStorage()), "%%mEmpty%%").toEqual([]);
});

test("%%tOne%%", () => {
  const empty = [];
  const book = { id: "b-1", title: "%%book1%%", status: "to-read" };
  expect(addBook(empty, book), "%%mOne%%").toEqual([book]);
  expect(empty, "%%mUnchanged%%").toEqual([]);
});

test("%%tMany%%", () => {
  const ids = booksWithStatus(makeBooks(), "reading").map((book) => book.id);
  expect(ids, "%%mMany%%").toEqual(["b-1", "b-3"]);
});


test("%%tReload%%", () => {
  const storage = makeStorage();
  saveBooks(storage, makeBooks());
  expect(loadBooks(storage), "%%mReload%%").toEqual(makeBooks());
});

test("%%tSubmit%%", () => {
  const root = document.createElement("div");
  document.body.append(root);
  const storage = makeStorage();
  mount(root, storage);
  root.querySelector('input[name="title"]').value = "%%book2%%";
  root.querySelector('button[type="submit"]').click();
  const items = [...root.querySelectorAll("li")].map((item) => item.textContent);
  root.remove();
  expect(items.length, "%%mItems%%").toBe(1);
  expect(items[0].includes("%%book2%%"), "%%mItemText%%").toBe(true);
  expect(loadBooks(storage).length, "%%mSaved%%").toBe(1);
});
