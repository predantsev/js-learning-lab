const status = document.querySelector("#status");
const stats = document.querySelector("#stats");
const results = document.querySelector("#results");

// Sends a new wish to the server; rejects when the server did not accept it.
async function saveWish(name) {
  const response = await fetch("/lab/echo?delay=300", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name }),
  });
  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
}

// 1. Shows "%%saving%%", saves the wish, and only after the server answered shows
//    "%%saved%%" — or "%%saveFailed%%" if saving failed.
async function saveAndConfirm(name) {
  status.textContent = "%%saving%%";
  await saveWish(name).then(
    () => {
      status.textContent = "%%saved%%";
    },
    () => {
      status.textContent = "%%saveFailed%%";
    },
  );
}

// 2. Gives the list of tips; on any failure gives an empty list instead of a rejection.
async function loadTips() {
  try {
    const response = await fetch("./data/tips.json");
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (error) {
    return [];
  }
}

// 3. Shows the number of wishes the server counted, or "%%statsError%%" when it could not.
async function showStats() {
  const response = await fetch("/lab/status/500");
  if (response.ok) {
    const body = await response.json();
    stats.textContent = "%%total%% " + body.total;
  } else {
    stats.textContent = "%%statsError%%";
  }
}

// 4. Shows how many wishes match the search. Only the latest search may be shown.
// Latest wins by aborting the previous search.
let searchController = null;

async function search(query, delay) {
  searchController?.abort();
  searchController = new AbortController();
  const signal = searchController.signal;
  const url = "/lab/search?ns=wishlist&lang=%%lang%%&delay=" + delay + "&q=" + encodeURIComponent(query);
  try {
    const response = await fetch(url, { signal: signal });
    const body = await response.json();
    results.textContent = query + ": " + body.results.length;
  } catch (error) {
    if (error.name !== "AbortError") {
      throw error;
    }
  }
}

document.querySelector("#save").addEventListener("click", () => saveAndConfirm("%%lamp%%"));
document.querySelector("#tips").addEventListener("click", async () => {
  console.log(await loadTips());
});
document.querySelector("#stats-button").addEventListener("click", () => showStats());
document.querySelector("#search").addEventListener("click", () => {
  search("%%shortQuery%%", 600);
  search("%%longQuery%%", 100);
});
