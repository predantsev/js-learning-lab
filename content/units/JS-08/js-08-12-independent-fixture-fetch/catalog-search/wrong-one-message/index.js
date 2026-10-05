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

// Mistake: one message for every failure, and no timeout.
async function searchBooks(query) {
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  status.textContent = "%%loading%%";
  try {
    const body = await getJson(searchUrl(query), signal);
    status.textContent = "%%found%% " + body.results.length;
    books.replaceChildren(...body.results.map((book) => {
      const item = document.createElement("li");
      item.textContent = book.title;
      return item;
    }));
    const firstThree = body.results.slice(0, 3);
    const settled = await Promise.allSettled(firstThree.map((book) => getJson(detailsUrl(book.id), signal)));
    details.replaceChildren(...settled.map((result, index) => {
      const item = document.createElement("li");
      item.textContent = firstThree[index].title + ": " + (result.status === "fulfilled" ? result.value.summary : "%%unavailable%%");
      return item;
    }));
  } catch (error) {
    if (error.name !== "AbortError") {
      status.textContent = "%%httpError%%";
    }
  }
}

document.querySelector("#query").addEventListener("input", (event) => {
  searchBooks(event.target.value);
});
