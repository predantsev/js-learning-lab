// A fake server for this example. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered.
// Tests control it through `settings`.
const START = [{ id: "t-01", title: "%%plants%%", done: false }];

export const settings = {
  delayMs: 300, // how long every answer takes
  failNext: 0, // how many of the next saves answer 503
};

let tasks = structuredClone(START);

export function resetServer() {
  tasks = structuredClone(START);
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
  return new Promise((resolve) => {
    setTimeout(() => {
      let response;
      if (fails) response = answer(503, { error: "unavailable" });
      else if (method === "GET") response = answer(200, tasks);
      else {
        const created = { id: `t-0${tasks.length + 1}`, done: false, ...JSON.parse(init.body) };
        tasks.push(created);
        response = answer(201, created);
      }
      console.log(`← #${number} ${response.status}`);
      resolve(response);
    }, settings.delayMs);
  });
};
