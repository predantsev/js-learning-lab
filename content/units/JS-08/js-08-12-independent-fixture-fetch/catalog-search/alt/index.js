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

// Latest wins by a request number; the previous request is aborted as well.
let latest = 0;
let controller = null;

// searchBooks(query): see the task for what it must do.
async function searchBooks(query) {
  latest += 1;
  const mine = latest;
  if (controller !== null) {
    controller.abort();
  }
  controller = new AbortController();
  const signal = controller.signal;
  status.textContent = "%%loading%%";
  try {
    const body = await withTimeout(getJson(searchUrl(query), signal), 3000);
    if (mine !== latest) {
      return;
    }
    status.textContent = "%%found%% " + body.results.length;
    books.replaceChildren(...body.results.map((book) => {
      const item = document.createElement("li");
      item.textContent = book.title;
      return item;
    }));
    const firstThree = body.results.slice(0, 3);
    const settled = await Promise.allSettled(firstThree.map((book) => getJson(detailsUrl(book.id), signal)));
    if (mine !== latest) {
      return;
    }
    details.replaceChildren(...settled.map((result, index) => {
      const item = document.createElement("li");
      item.textContent = firstThree[index].title + ": " + (result.status === "fulfilled" ? result.value.summary : "%%unavailable%%");
      return item;
    }));
  } catch (error) {
    if (mine !== latest) {
      return;
    }
    books.replaceChildren();
    details.replaceChildren();
    const messages = { TimeoutError: "%%timeout%%", TypeError: "%%offline%%" };
    status.textContent = messages[error.name] ?? "%%httpError%%";
  }
}

document.querySelector("#query").addEventListener("input", (event) => {
  searchBooks(event.target.value);
});
