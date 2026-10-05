// A fake bookmarks server. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered, × aborted.
//   GET    /api/bookmarks       → 200 [{ id, title, url, favorite }]
//   POST   /api/bookmarks       { title, url }   → 201 the created bookmark
//   PATCH  /api/bookmarks/<id>  { favorite }     → 200 the whole bookmark
//   DELETE /api/bookmarks/<id>                   → 200 { id }
// Your tests control it with `settings` and start every test with `resetServer()`.
const START = [
  { id: "b-01", title: "%%borshch%%", url: "https://example.com/borshch", favorite: false },
  { id: "b-02", title: "%%bus%%", url: "https://example.com/bus", favorite: true },
];

export const settings = {
  readDelayMs: 60, // a GET
  writeDelayMs: 100, // a POST, PATCH or DELETE
  failNextWrite: 0, // how many of the next writes answer 503
  failNextRead: 0, // how many of the next reads answer 503
};
export const requests = []; // { number, method, path, body, outcome }

let bookmarks = structuredClone(START);
let nextId = 3;
let pending = 0;

// Starts from the two bookmarks above (or from the list you pass) with the default switches.
export function resetServer(list = START) {
  bookmarks = structuredClone(list);
  nextId = 3;
  Object.assign(settings, { readDelayMs: 60, writeDelayMs: 100, failNextWrite: 0, failNextRead: 0 });
}

// Resolves once no request has been on its way for 30 ms, so React has had a moment to show
// the answers and to start any follow-up request.
export function whenIdle() {
  return new Promise((resolve) => {
    let quietSince = null;
    const check = () => {
      if (pending > 0) quietSince = null;
      else if (quietSince === null) quietSince = Date.now();
      else if (Date.now() - quietSince >= 30) return resolve();
      setTimeout(check, 10);
    };
    check();
  });
}

function answer(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function route(method, path, body) {
  if (method === "GET" && path === "/api/bookmarks") return answer(200, bookmarks);
  if (method === "POST" && path === "/api/bookmarks") {
    const created = { id: `b-${String(nextId).padStart(2, "0")}`, favorite: false, ...body };
    nextId += 1;
    bookmarks.push(created);
    return answer(201, created);
  }
  const match = path.match(/^\/api\/bookmarks\/(b-\d+)$/);
  const bookmark = match && bookmarks.find((item) => item.id === match[1]);
  if (method === "PATCH" && bookmark) return answer(200, Object.assign(bookmark, body));
  if (method === "DELETE" && bookmark) {
    bookmarks = bookmarks.filter((item) => item !== bookmark);
    return answer(200, { id: bookmark.id });
  }
  return answer(404, { error: "not found" });
}

const realFetch = window.fetch;

window.fetch = (input, init = {}) => {
  const url = new URL(input, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  const method = (init.method ?? "GET").toUpperCase();
  const body = init.body ? JSON.parse(init.body) : undefined;
  const request = { number: requests.length + 1, method, path: url.pathname, body, outcome: "pending" };
  requests.push(request);
  const isRead = method === "GET";
  const fails = isRead ? settings.failNextRead > 0 : settings.failNextWrite > 0;
  if (fails && isRead) settings.failNextRead -= 1;
  if (fails && !isRead) settings.failNextWrite -= 1;
  console.log(`→ #${request.number} ${method} ${url.pathname}`);
  pending += 1;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      init.signal?.removeEventListener("abort", onAbort);
      pending -= 1;
      const response = fails ? answer(503, { error: "unavailable" }) : route(method, url.pathname, body);
      request.outcome = String(response.status);
      console.log(`← #${request.number} ${response.status}`);
      resolve(response);
    }, isRead ? settings.readDelayMs : settings.writeDelayMs);
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
