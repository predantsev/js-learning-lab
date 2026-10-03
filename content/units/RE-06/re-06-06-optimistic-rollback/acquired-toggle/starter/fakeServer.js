// A fake server for this exercise. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered.
// The checks change `settings`, read `requests` and call `resetServer()`.
const START = [
  { id: "w-01", name: "%%headphones%%", acquired: false },
  { id: "w-02", name: "%%lamp%%", acquired: false },
  { id: "w-03", name: "%%bicycle%%", acquired: false },
  { id: "w-04", name: "%%book%%", acquired: true },
];

export const settings = {
  delayMs: 700, // how long every change takes (reading the list takes 100 ms)
  failNext: 0, // how many of the next changes answer 503
};
export const requests = []; // { number, method, path, body, outcome }

let wishes = structuredClone(START);

export function resetServer() {
  wishes = structuredClone(START);
}

export function wishOnServer(id) {
  return structuredClone(wishes.find((wish) => wish.id === id));
}

function answer(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const realFetch = window.fetch;

window.fetch = (input, init = {}) => {
  const url = new URL(input, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  const method = (init.method ?? "GET").toUpperCase();
  const body = init.body ? JSON.parse(init.body) : undefined;
  const request = { number: requests.length + 1, method, path: url.pathname, body, outcome: "pending" };
  requests.push(request);
  const fails = method !== "GET" && settings.failNext > 0;
  if (fails) settings.failNext -= 1;
  console.log(`→ #${request.number} ${method} ${url.pathname}${init.body ? " " + init.body : ""}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      const match = url.pathname.match(/^\/api\/wishes\/(w-\d+)$/);
      const wish = match && wishes.find((item) => item.id === match[1]);
      let response;
      if (fails) response = answer(503, { error: "unavailable" });
      else if (method === "GET" && url.pathname === "/api/wishes") response = answer(200, wishes);
      else if (method === "PATCH" && wish) response = answer(200, Object.assign(wish, body));
      else response = answer(404, { error: "not found" });
      request.outcome = String(response.status);
      console.log(`← #${request.number} ${response.status}`);
      resolve(response);
    }, method === "GET" ? 100 : settings.delayMs);
  });
};
