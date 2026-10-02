const status = document.querySelector("#status");
const list = document.querySelector("#results");

// The lab search address for a query. encodeURIComponent prepares any text,
// even with spaces or "&", to be part of an address (more about addresses in a later unit).
function searchUrl(query) {
  return "/lab/search?ns=planner&lang=%%lang%%&q=" + encodeURIComponent(query);
}

function renderResults(tasks) {
  status.textContent = "%%found%% " + tasks.length;
  list.replaceChildren(...tasks.map((task) => {
    const item = document.createElement("li");
    item.textContent = task.title;
    return item;
  }));
}

function renderError() {
  status.textContent = "%%error%%";
  list.replaceChildren();
}

let controller = null;

// Searches the tasks for `query` and renders the results.
// A new search aborts the previous request. An aborted search shows no error;
// any other failure (a response that is not ok, no network) shows renderError().
async function searchRecords(query) {
  // Mistake: an abort is treated like a failure, so every fast typist sees an error.
  controller?.abort();
  controller = new AbortController();
  try {
    const response = await fetch(searchUrl(query), { signal: controller.signal });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    const body = await response.json();
    renderResults(body.results);
  } catch (error) {
    renderError();
  }
}

document.querySelector("#query").addEventListener("input", (event) => {
  searchRecords(event.target.value);
});
