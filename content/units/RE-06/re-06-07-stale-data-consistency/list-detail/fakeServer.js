// A fake server for this lesson. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered.
const habits = [
  { id: "h-01", name: "%%exercise%%", frequency: "daily" },
  { id: "h-02", name: "%%read%%", frequency: "daily" },
  { id: "h-04", name: "%%tidy%%", frequency: "weekly" },
];
const DELAY_MS = 300;
const realFetch = window.fetch;
let sent = 0;

function answer(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function route(method, path, body) {
  if (method === "GET" && path === "/api/habits") return answer(200, habits);
  const match = path.match(/^\/api\/habits\/(h-\d+)$/);
  const habit = match && habits.find((item) => item.id === match[1]);
  if (method === "GET" && habit) return answer(200, habit);
  if (method === "PATCH" && habit) return answer(200, Object.assign(habit, body));
  return answer(404, { error: "not found" });
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
      const response = route(method, url.pathname, init.body ? JSON.parse(init.body) : undefined);
      console.log(`← #${number} ${response.status}`);
      resolve(response);
    }, DELAY_MS);
  });
};
