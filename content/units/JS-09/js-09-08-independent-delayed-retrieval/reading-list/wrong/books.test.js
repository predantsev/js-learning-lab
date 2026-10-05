import { test, expect } from "./testing.js";
import { addBook, booksWithStatus } from "./books.js";
import { loadBooks, saveBooks, STORAGE_KEY } from "./storage.js";
import { mount } from "./ui.js";

test("%%tOne%%", () => {
  const book = { id: "b-1", title: "%%book1%%", status: "to-read" };
  expect(addBook([], book), "%%mOne%%").toEqual([book]);
});

test("%%tMany%%", () => {
  const books = [
    { id: "b-1", title: "%%book1%%", status: "reading" },
    { id: "b-2", title: "%%book2%%", status: "to-read" },
  ];
  expect(booksWithStatus(books, "reading").map((book) => book.id), "%%mMany%%").toEqual(["b-1"]);
});
