import { getJson } from "./request.js";
import { withTimeout } from "./timeout.js";

const status = document.querySelector("#status");
const books = document.querySelector("#books");
const details = document.querySelector("#details");

// The address of a catalog search and of one book's details.
function searchUrl(query) {
  return "./data/catalog.json?q=" + encodeURIComponent(query);
}

function detailsUrl(id) {
  return "./data/details/" + id + ".json";
}

let controller = null;

// Mistake: Promise.all loses every detail when one of them fails.
async function searchBooks(query) {
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  status.textContent = "%%loading%%";
  let body;
  try {
    body = await withTimeout(getJson(searchUrl(query), signal), 3000);
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    books.replaceChildren();
    if (error.name === "TimeoutError") {
      status.textContent = "%%timeout%%";
    } else if (error instanceof TypeError) {
      status.textContent = "%%offline%%";
    } else {
      status.textContent = "%%httpError%%";
    }
    return;
  }
  status.textContent = "%%found%% " + body.results.length;
  books.replaceChildren(...body.results.map((book) => {
    const item = document.createElement("li");
    item.textContent = book.title;
    return item;
  }));
  const firstThree = body.results.slice(0, 3);
  try {
    const all = await Promise.all(firstThree.map((book) => getJson(detailsUrl(book.id), signal)));
    details.replaceChildren(...all.map((detail, index) => {
      const item = document.createElement("li");
      item.textContent = firstThree[index].title + ": " + detail.summary;
      return item;
    }));
  } catch (error) {
    details.replaceChildren();
  }
}

document.querySelector("#query").addEventListener("input", (event) => {
  searchBooks(event.target.value);
});
