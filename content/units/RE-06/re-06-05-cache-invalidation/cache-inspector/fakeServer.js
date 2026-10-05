// A fake server for this lesson. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered.
const wishes = [
  { id: "w-01", name: "%%headphones%%", acquired: false },
  { id: "w-02", name: "%%lamp%%", acquired: false },
  { id: "w-04", name: "%%book%%", acquired: true },
];
const categories = ["%%tech%%", "%%home%%", "%%books%%"];
const DELAY_MS = 400;
const realFetch = window.fetch;
let sent = 0;
let nextId = 7;

function answer(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function route(method, url, body) {
  if (method === "GET" && url.pathname === "/api/categories") return answer(200, categories);
  if (method === "GET" && url.pathname === "/api/wishes") {
    const filter = url.searchParams.get("filter") ?? "all";
    return answer(200, wishes.filter((wish) => filter === "all" || wish.acquired === (filter === "acquired")));
  }
  if (method === "POST" && url.pathname === "/api/wishes") {
    const created = { id: `w-${String(nextId).padStart(2, "0")}`, acquired: false, ...body };
    nextId += 1;
    wishes.push(created);
    return answer(201, created);
  }
  return answer(404, { error: "not found" });
}

window.fetch = (input, init = {}) => {
  const url = new URL(input, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  sent += 1;
  const number = sent;
  const method = (init.method ?? "GET").toUpperCase();
  console.log(`→ #${number} ${method} ${url.pathname}${url.search}`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      init.signal?.removeEventListener("abort", onAbort);
      const response = route(method, url, init.body ? JSON.parse(init.body) : undefined);
      console.log(`← #${number} ${response.status}`);
      resolve(response);
    }, DELAY_MS);
    function onAbort() {
      clearTimeout(timer);
      console.log(`× #${number} aborted`);
      reject(new DOMException("The request was aborted.", "AbortError"));
    }
    init.signal?.addEventListener("abort", onAbort, { once: true });
  });
};
