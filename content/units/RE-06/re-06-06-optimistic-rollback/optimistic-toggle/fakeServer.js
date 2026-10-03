// A fake server for this lesson. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered.
const tasks = [
  { id: "t-01", title: "%%plants%%", done: false },
  { id: "t-02", title: "%%library%%", done: false },
  { id: "t-03", title: "%%grandma%%", done: false },
];

export const settings = {
  delayMs: 800, // how long every answer takes
  failNext: 0, // how many of the next requests answer 503
};

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
  const fails = method !== "GET" && settings.failNext > 0;
  if (fails) settings.failNext -= 1;
  console.log(`→ #${number} ${method} ${url.pathname}${init.body ? " " + init.body : ""}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      let response;
      const match = url.pathname.match(/^\/api\/tasks\/(t-\d+)$/);
      const task = match && tasks.find((item) => item.id === match[1]);
      if (fails) response = answer(503, { error: "unavailable" });
      else if (method === "GET" && url.pathname === "/api/tasks") response = answer(200, tasks);
      else if (method === "PATCH" && task) response = answer(200, Object.assign(task, JSON.parse(init.body)));
      else response = answer(404, { error: "not found" });
      console.log(`← #${number} ${response.status}`);
      resolve(response);
    }, method === "GET" ? 200 : settings.delayMs);
  });
};
