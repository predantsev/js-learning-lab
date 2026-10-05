// Shows the summary on the page and redraws it when the search text changes. Read-only.
import { showSummary, view } from "./page.ts";
import { HABITS } from "./fixtures.js";

const root = document.querySelector("#summary");
const search = document.querySelector("#search");
showSummary(root, HABITS);
search.addEventListener("input", () => {
  view.query = search.value;
  showSummary(root, HABITS);
});
