// A fake server for this lesson. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered, × aborted.
// A search for one letter (or none) takes longer than a search for two or more letters.
const START = [
  { id: "w-01", name: "%%headphones%%", acquired: false },
  { id: "w-02", name: "%%lamp%%", acquired: false },
  { id: "w-03", name: "%%bicycle%%", acquired: false },
  { id: "w-04", name: "%%book%%", acquired: true },
  { id: "w-05", name: "%%tickets%%", acquired: false },
  { id: "w-06", name: "%%mug%%", acquired: true },
];

export const settings = {
  shortQueryMs: 450, // a search for 0–1 letters
  longQueryMs: 150, // a search for 2 or more letters
  saveDelayMs: 250, // a PATCH
  failNext: 0, // how many of the next PATCH requests answer 503
};
export const requests = []; // { number, method, path, outcome }

let wishes = structuredClone(START);
let pending = 0;

// Called before every test: the same wishes and switches every time.
export function resetServer() {
  wishes = structuredClone(START);
  settings.shortQueryMs = 450;
  settings.longQueryMs = 150;
  settings.saveDelayMs = 250;
  settings.failNext = 0;
}

// Resolves once no request is on its way and React has had a moment to show the answers:
// a deterministic way to wait even for a late response.
export function whenIdle() {
  return new Promise((resolve) => {
    const check = () => (pending === 0 ? setTimeout(resolve, 30) : setTimeout(check, 10));
    check();
  });
}

function answer(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function route(method, url, body) {
  if (method === "GET" && url.pathname === "/api/wishes") {
    const query = (url.searchParams.get("q") ?? "").toLowerCase();
    return answer(200, wishes.filter((wish) => wish.name.toLowerCase().includes(query)));
  }
  const match = url.pathname.match(/^\/api\/wishes\/(w-\d+)$/);
  const wish = match && wishes.find((item) => item.id === match[1]);
  if (method === "PATCH" && wish) return answer(200, Object.assign(wish, body));
  return answer(404, { error: "not found" });
}

const realFetch = window.fetch;

window.fetch = (input, init = {}) => {
  const url = new URL(input, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  const method = (init.method ?? "GET").toUpperCase();
  const request = { number: requests.length + 1, method, path: url.pathname + decodeURIComponent(url.search), outcome: "pending" };
  requests.push(request);
  const fails = method === "PATCH" && settings.failNext > 0;
  if (fails) settings.failNext -= 1;
  const query = url.searchParams.get("q") ?? "";
  const delayMs = method === "PATCH" ? settings.saveDelayMs : query.length <= 1 ? settings.shortQueryMs : settings.longQueryMs;
  console.log(`→ #${request.number} ${method} ${request.path}`);
  pending += 1;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      init.signal?.removeEventListener("abort", onAbort);
      pending -= 1;
      const response = fails ? answer(503, { error: "unavailable" }) : route(method, url, init.body ? JSON.parse(init.body) : undefined);
      request.outcome = String(response.status);
      console.log(`← #${request.number} ${response.status}`);
      resolve(response);
    }, delayMs);
    function onAbort() {
      clearTimeout(timer);
      pending -= 1;
      request.outcome = "aborted";
      console.log(`× #${request.number} aborted`);
      reject(new DOMException("The request was aborted.", "AbortError"));
    }
    init.signal?.addEventListener("abort", onAbort, { once: true });
  });
};
