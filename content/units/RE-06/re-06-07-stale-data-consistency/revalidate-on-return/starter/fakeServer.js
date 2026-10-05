// A fake server for this exercise. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered.
// Its clock moves 5 minutes forward with every list request, so each answer has its own time.
// The checks call `resetServer()`, `editOnServer()` (a change made on another device) and read `requests`.
const START = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000 },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000 },
];

export const settings = { delayMs: 300 };
export const requests = []; // { number, method, path }

let expenses = structuredClone(START);
let minutes = 10 * 60; // the server clock: 10:00

export function resetServer() {
  expenses = structuredClone(START);
  minutes = 10 * 60;
}

export function editOnServer(id, patch) {
  Object.assign(expenses.find((expense) => expense.id === id), patch);
  console.log(`server: ${id} changed on another device`);
}

function clock() {
  const text = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  minutes += 5;
  return text;
}

function answer(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const realFetch = window.fetch;

window.fetch = (input, init = {}) => {
  const url = new URL(input, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  const method = (init.method ?? "GET").toUpperCase();
  const request = { number: requests.length + 1, method, path: url.pathname };
  requests.push(request);
  console.log(`→ #${request.number} ${method} ${url.pathname}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      const response =
        method === "GET" && url.pathname === "/api/expenses"
          ? answer(200, { items: expenses, servedAt: clock() })
          : answer(404, { error: "not found" });
      console.log(`← #${request.number} ${response.status}`);
      resolve(response);
    }, settings.delayMs);
  });
};
