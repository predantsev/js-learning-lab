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

// searchBooks(query): see the task for what it must do.
async function searchBooks(query) {
  // your code here
}

document.querySelector("#query").addEventListener("input", (event) => {
  searchBooks(event.target.value);
});
