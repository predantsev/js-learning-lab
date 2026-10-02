// The events page, written with URLSearchParams, a Headers check by prefix and helper builders.
const API = "/api/events";
const CITY_KEY = "events.city";
const WEB_SCHEMES = new Set(["http:", "https:"]);

function searchUrl(base, { query, city } = {}) {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (city) params.append("city", city);
  const text = params.toString();
  return text ? `${base}?${text}` : base;
}

async function loadEvents(url) {
  try {
    const response = await fetch(url);
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !type.startsWith("application/json")) return { ok: false };
    const events = JSON.parse(await response.text());
    return Array.isArray(events) ? { ok: true, events } : { ok: false };
  } catch (error) {
    return { ok: false };
  }
}

function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function organizerNode(organizer) {
  const url = URL.canParse(organizer?.url ?? "") ? new URL(organizer.url) : null;
  if (url && WEB_SCHEMES.has(url.protocol)) {
    const link = element("a", organizer.name);
    link.setAttribute("href", url.href);
    const paragraph = document.createElement("p");
    paragraph.append(link);
    return paragraph;
  }
  return element("p", organizer?.name ?? "");
}

function renderEvents(events) {
  const list = document.querySelector("#events");
  list.replaceChildren();
  for (const event of events) {
    const item = document.createElement("li");
    item.append(element("h3", event.title), organizerNode(event.organizer));
    list.append(item);
  }
}

function restoreFilter() {
  const saved = localStorage.getItem(CITY_KEY);
  const select = document.querySelector("#city");
  if (saved && select.querySelector(`option[value="${CSS.escape(saved)}"]`)) select.value = saved;
}

document.querySelector("#city").addEventListener("change", (event) => {
  localStorage.setItem(CITY_KEY, event.target.value);
});

document.querySelector("#search-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.querySelector("#status");
  status.textContent = "%%loading%%";
  const url = searchUrl(API, { query: document.querySelector("#query").value.trim(), city: document.querySelector("#city").value });
  const result = await loadEvents(url);
  renderEvents(result.ok ? result.events : []);
  status.textContent = result.ok ? `%%found%% ${result.events.length}` : "%%loadFailed%%";
});

restoreFilter();
