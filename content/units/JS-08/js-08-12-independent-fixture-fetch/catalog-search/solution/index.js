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

function showList(element, texts) {
  element.replaceChildren(...texts.map((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }));
}

// searchBooks(query): see the task for what it must do.
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
    showList(books, []);
    showList(details, []);
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
  showList(books, body.results.map((book) => book.title));

  const firstThree = body.results.slice(0, 3);
  const settled = await Promise.allSettled(firstThree.map((book) => getJson(detailsUrl(book.id), signal)));
  if (signal.aborted) {
    return;
  }
  showList(details, settled.map((result, index) => {
    const summary = result.status === "fulfilled" ? result.value.summary : "%%unavailable%%";
    return firstThree[index].title + ": " + summary;
  }));
}

document.querySelector("#query").addEventListener("input", (event) => {
  searchBooks(event.target.value);
});
