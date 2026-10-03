// A fake server for this exercise. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered.
// Your tests control it: `settings.failNext = 1` makes the next save answer 503.
const START = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000 },
];

export const settings = {
  readDelayMs: 150, // how long reading the list takes
  saveDelayMs: 300, // how long saving takes (the course checks also try a much slower save)
  failNext: 0, // how many of the next saves answer 503
};

let expenses = structuredClone(START);
let nextId = 3;

// main.jsx calls this before every test, so each test starts from the same two expenses.
export function resetServer() {
  expenses = structuredClone(START);
  nextId = 3;
  settings.failNext = 0;
}

function answer(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const realFetch = window.fetch;
let sent = 0;

window.fetch = (input, init = {}) => {
  const url = new URL(input, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  sent += 1;
  const number = sent;
  const method = (init.method ?? "GET").toUpperCase();
  const fails = method === "POST" && settings.failNext > 0;
  if (fails) settings.failNext -= 1;
  console.log(`→ #${number} ${method} ${url.pathname}`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      init.signal?.removeEventListener("abort", onAbort);
      let response;
      if (fails) response = answer(503, { error: "unavailable" });
      else if (method === "GET" && url.pathname === "/api/expenses") response = answer(200, expenses);
      else if (method === "POST" && url.pathname === "/api/expenses") {
        const created = { id: `e-${String(nextId).padStart(2, "0")}`, ...JSON.parse(init.body) };
        nextId += 1;
        expenses.push(created);
        response = answer(201, created);
      } else response = answer(404, { error: "not found" });
      console.log(`← #${number} ${response.status}`);
      resolve(response);
    }, method === "GET" ? settings.readDelayMs : settings.saveDelayMs);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException("The request was aborted.", "AbortError"));
    }
    init.signal?.addEventListener("abort", onAbort, { once: true });
  });
};
