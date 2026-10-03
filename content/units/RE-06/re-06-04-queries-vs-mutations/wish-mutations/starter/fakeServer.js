// A fake server for this exercise. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered.
// The checks change `settings` and read `requests`.
const START = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false },
  { id: "w-03", name: "%%bicycle%%", price: 240, acquired: false },
];

export const settings = {
  delayMs: 300, // how long every answer takes
  failNext: 0, // how many of the next requests answer 503
  offlineNext: 0, // how many of the next requests fail like a lost connection
};
export const requests = []; // { number, method, path, body }

let wishes = structuredClone(START);
let nextId = START.length + 1;

export function resetServer() {
  wishes = structuredClone(START);
  nextId = START.length + 1;
}

function answer(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function route(method, path, body) {
  if (method === "GET" && path === "/api/wishes") return answer(200, wishes);
  if (method === "POST" && path === "/api/wishes") {
    const created = { id: `w-${String(nextId).padStart(2, "0")}`, price: null, acquired: false, ...body };
    nextId += 1;
    wishes.push(created);
    return answer(201, created);
  }
  const match = path.match(/^\/api\/wishes\/([\w-]+)$/);
  if (method === "PATCH" && match) {
    const wish = wishes.find((item) => item.id === match[1]);
    if (!wish) return answer(404, { error: "not found" });
    Object.assign(wish, body);
    return answer(200, wish);
  }
  return answer(404, { error: "not found" });
}

const realFetch = window.fetch;

window.fetch = (input, init = {}) => {
  const url = new URL(input, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  const method = (init.method ?? "GET").toUpperCase();
  const body = init.body ? JSON.parse(init.body) : undefined;
  const request = { number: requests.length + 1, method, path: url.pathname, body };
  requests.push(request);
  const fails = settings.failNext > 0;
  if (fails) settings.failNext -= 1;
  const offline = !fails && settings.offlineNext > 0;
  if (offline) settings.offlineNext -= 1;
  console.log(`→ #${request.number} ${method} ${url.pathname}${init.body ? " " + init.body : ""}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (offline) {
        console.log(`× #${request.number} network error`);
        reject(new TypeError("Failed to fetch"));
        return;
      }
      const response = fails ? answer(503, { error: "unavailable" }) : route(method, url.pathname, body);
      console.log(`← #${request.number} ${response.status}`);
      resolve(response);
    }, settings.delayMs);
  });
};
