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

// Mistake: no cancellation and no latest-wins guard; details are loaded one by one.
async function searchBooks(query) {
  status.textContent = "%%loading%%";
  try {
    const body = await withTimeout(getJson(searchUrl(query)), 3000);
    status.textContent = "%%found%% " + body.results.length;
    books.replaceChildren(...body.results.map((book) => {
      const item = document.createElement("li");
      item.textContent = book.title;
      return item;
    }));
    const lines = [];
    for (const book of body.results.slice(0, 3)) {
      try {
        const detail = await getJson(detailsUrl(book.id));
        lines.push(book.title + ": " + detail.summary);
      } catch (error) {
        lines.push(book.title + ": " + "%%unavailable%%");
      }
    }
    details.replaceChildren(...lines.map((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      return item;
    }));
  } catch (error) {
    if (error.name === "TimeoutError") {
      status.textContent = "%%timeout%%";
    } else if (error instanceof TypeError) {
      status.textContent = "%%offline%%";
    } else {
      status.textContent = "%%httpError%%";
    }
  }
}

document.querySelector("#query").addEventListener("input", (event) => {
  searchBooks(event.target.value);
});
