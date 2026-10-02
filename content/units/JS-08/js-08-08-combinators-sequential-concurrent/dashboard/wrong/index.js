const SOURCES = [
  { label: "%%wishes%%", url: "/lab/wishlist/items?lang=%%lang%%" },
  { label: "%%tasks%%", url: "/lab/planner/items?lang=%%lang%%" },
  { label: "%%habits%%", url: "/lab/habits/items?lang=%%lang%%" },
];

// Fetches JSON; rejects when the response is not ok or there is no network.
async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
  return response.json();
}

// Shows `counts` ([{ label, count }]) and `failed` ([label]) on the page.
function renderDashboard(counts, failed) {
  document.querySelector("#counts").replaceChildren(...counts.map((entry) => {
    const item = document.createElement("li");
    item.textContent = entry.label + ": " + entry.count;
    return item;
  }));
  document.querySelector("#failed").replaceChildren(...failed.map((label) => {
    const item = document.createElement("li");
    item.textContent = label;
    return item;
  }));
}

// Requests all SOURCES at the same time and renders whatever succeeded:
// for every source that answered, { label, count: body.items.length } goes into counts;
// the label of every source that failed goes into failed.
async function loadDashboard() {
  // Mistake: await inside the loop makes the requests run one after another.
  const counts = [];
  const failed = [];
  for (const source of SOURCES) {
    try {
      const body = await getJson(source.url);
      counts.push({ label: source.label, count: body.items.length });
    } catch (error) {
      failed.push(source.label);
    }
  }
  renderDashboard(counts, failed);
}

loadDashboard();
