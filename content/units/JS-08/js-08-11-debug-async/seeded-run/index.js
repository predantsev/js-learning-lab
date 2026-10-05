// A seeded program with four async defects. Run it and match every console line to a defect.

// A: the save is not awaited.
async function saveWish(name) {
  const response = await fetch("/lab/echo?delay=300", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name }),
  });
  console.log("A: %%serverAnswered%%", response.status);
}

async function onSave() {
  saveWish("%%lamp%%");
  console.log("A: %%uiSaved%%");
}

// B: nobody handles the rejection (there is no data/tips.json, and the 404 page is not JSON).
function loadTips() {
  return fetch("./data/tips.json").then((response) => response.json());
}

// C: a 500 answer is treated as success.
async function loadStats() {
  const response = await fetch("/lab/status/500");
  const stats = await response.json();
  console.log("C: %%wishesTotal%%", stats.total);
}

// D: no latest-wins guard.
async function search(query, delay) {
  const url = "/lab/search?ns=wishlist&lang=%%lang%%&delay=" + delay + "&q=" + encodeURIComponent(query);
  const response = await fetch(url);
  const body = await response.json();
  console.log("D: %%showing%%", query, "—", body.results.length);
}

await onSave();
loadTips();
await loadStats();
search("%%shortQuery%%", 600);
search("%%longQuery%%", 100);
