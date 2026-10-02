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
  try {
    await saveWish(name);
    status.textContent = "%%saved%%";
  } catch (error) {
    status.textContent = "%%saveFailed%%";
  }
}

// 2. Gives the list of tips; on any failure gives an empty list instead of a rejection.
function loadTips() {
  return fetch("./data/tips.json")
    .then((response) => response.json())
    .catch(() => []);
}

// 3. Shows the number of wishes the server counted, or "%%statsError%%" when it could not.
async function showStats() {
  // Mistake: the 500 answer is still read as data; only a rejection would be caught.
  try {
    const response = await fetch("/lab/status/500");
    const body = await response.json();
    stats.textContent = "%%total%% " + body.total;
  } catch (error) {
    stats.textContent = "%%statsError%%";
  }
}

// 4. Shows how many wishes match the search. Only the latest search may be shown.
let latestSearch = 0;

async function search(query, delay) {
  latestSearch += 1;
  const mine = latestSearch;
  const url = "/lab/search?ns=wishlist&lang=%%lang%%&delay=" + delay + "&q=" + encodeURIComponent(query);
  const response = await fetch(url);
  const body = await response.json();
  if (mine !== latestSearch) {
    return;
  }
  results.textContent = query + ": " + body.results.length;
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
