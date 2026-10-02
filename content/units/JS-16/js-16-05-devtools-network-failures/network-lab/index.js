// Loads the habit fixtures from the lab server in five ways and shows what the code saw.
const BASE = "/lab/habits/items";
const TIMEOUT_MS = 2000;

const REQUESTS = {
  ok: `${BASE}?lang=%%lang%%`,
  missing: `${BASE}/h-99?lang=%%lang%%`,
  broken: `${BASE}?lang=%%lang%%&status=500`,
  slow: `${BASE}?lang=%%lang%%&delay=2500`, // the server waits 2.5 s before answering
  cancel: `${BASE}?lang=%%lang%%&delay=1000`,
};

const status = document.querySelector("#status");
const list = document.querySelector("#habits");

async function load(kind) {
  status.textContent = "%%loading%%";
  list.replaceChildren();
  const controller = new AbortController();
  if (kind === "cancel") setTimeout(() => controller.abort(), 100);
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(TIMEOUT_MS)]);
  try {
    const response = await fetch(REQUESTS[kind], { signal });
    if (!response.ok) {
      status.textContent = `%%httpError%% (${response.status})`;
      console.log(kind, "→ HTTP", response.status);
      return;
    }
    const { items } = await response.json();
    for (const habit of items) {
      const item = document.createElement("li");
      item.textContent = habit.name;
      list.append(item);
    }
    status.textContent = `%%loaded%% ${items.length}`;
    console.log(kind, "→", response.status, items.length);
  } catch (error) {
    const text = { AbortError: "%%aborted%%", TimeoutError: "%%timeout%%" }[error.name] ?? "%%networkError%%";
    status.textContent = text;
    console.log(kind, "→", error.name, error.message);
  }
}

for (const button of document.querySelectorAll("[data-load]")) {
  button.addEventListener("click", () => load(button.dataset.load));
}
