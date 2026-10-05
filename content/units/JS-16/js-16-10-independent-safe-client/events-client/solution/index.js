// The events page. Read the task first; the names below are what the checks call.
const API = "/api/events";
const CITY_KEY = "events.city";

const form = document.querySelector("#search-form");
const queryInput = document.querySelector("#query");
const citySelect = document.querySelector("#city");
const status = document.querySelector("#status");
const list = document.querySelector("#events");

function searchUrl(base, { query, city } = {}) {
  const url = new URL(base, location.href);
  for (const [name, value] of Object.entries({ q: query, city })) {
    if (typeof value === "string" && value.trim() !== "") url.searchParams.set(name, value);
  }
  return url.pathname + url.search;
}

async function loadEvents(url) {
  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (error) {
    return { ok: false };
  }
  if (!response.ok) return { ok: false };
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) return { ok: false };
  try {
    const events = await response.json();
    return Array.isArray(events) ? { ok: true, events } : { ok: false };
  } catch (error) {
    return { ok: false };
  }
}

function safeHref(text) {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch (error) {
    return null;
  }
}

function renderEvents(events) {
  const items = events.map((event) => {
    const item = document.createElement("li");
    const title = document.createElement("h3");
    title.textContent = event.title;
    const organizer = document.createElement("p");
    const href = safeHref(event.organizer?.url);
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = event.organizer.name;
      organizer.append(link);
    } else {
      organizer.textContent = event.organizer?.name ?? "";
    }
    item.append(title, organizer);
    return item;
  });
  list.replaceChildren(...items);
}

function restoreFilter() {
  const saved = localStorage.getItem(CITY_KEY);
  if (saved !== null && [...citySelect.options].some((option) => option.value === saved)) {
    citySelect.value = saved;
  }
}

citySelect.addEventListener("change", () => {
  localStorage.setItem(CITY_KEY, citySelect.value);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "%%loading%%";
  const result = await loadEvents(searchUrl(API, { query: queryInput.value, city: citySelect.value }));
  if (result.ok) {
    renderEvents(result.events);
    status.textContent = `%%found%% ${result.events.length}`;
  } else {
    renderEvents([]);
    status.textContent = "%%loadFailed%%";
  }
});

restoreFilter();
