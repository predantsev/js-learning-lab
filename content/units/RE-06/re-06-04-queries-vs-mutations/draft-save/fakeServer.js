// A fake server for this lesson. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered.
const expenses = [{ id: "e-01", label: "%%groceries%%", amountMinor: 84550 }];
const DELAY_MS = 300;
const realFetch = window.fetch;
let sent = 0;

function answer(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

window.fetch = (input, init = {}) => {
  const url = new URL(input, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  sent += 1;
  const number = sent;
  const method = (init.method ?? "GET").toUpperCase();
  console.log(`→ #${number} ${method} ${url.pathname}${init.body ? " " + init.body : ""}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      let response;
      if (method === "GET" && url.pathname === "/api/expenses") {
        response = answer(200, expenses);
      } else if (method === "POST" && url.pathname === "/api/expenses") {
        const created = { id: `e-${String(expenses.length + 1).padStart(2, "0")}`, ...JSON.parse(init.body) };
        expenses.push(created);
        response = answer(201, created);
      } else {
        response = answer(404, { error: "not found" });
      }
      console.log(`← #${number} ${response.status}`);
      resolve(response);
    }, DELAY_MS);
  });
};
