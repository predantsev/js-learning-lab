// A fake server for this exercise. It replaces `fetch` for addresses that start with /api/,
// answers from memory after a delay and prints every request: → sent, ← answered, × aborted.
// The checks change `settings` and read `requests`.
const START = [
  { id: "t-01", title: "%%plants%%", dueDate: "2026-03-02", done: false },
  { id: "t-02", title: "%%library%%", dueDate: "2026-03-01", done: false },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false },
  { id: "t-04", title: "%%internet%%", dueDate: "2026-02-27", done: true },
];
const TODAY = "2026-03-02";

export const settings = { delayMs: 300 };
export const requests = []; // { number, method, path }

let tasks = structuredClone(START);
let nextId = 5;

export function resetServer() {
  tasks = structuredClone(START);
  nextId = 5;
}

function answer(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function route(method, url, body) {
  const path = url.pathname;
  if (method === "GET" && path === "/api/settings") return answer(200, { listName: "%%listName%%" });
  if (method === "GET" && path === "/api/tasks/due-count") {
    return answer(200, { count: tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= TODAY).length });
  }
  if (method === "GET" && path === "/api/tasks") {
    const filter = url.searchParams.get("filter") ?? "all";
    return answer(200, tasks.filter((task) => filter === "all" || task.done === (filter === "done")));
  }
  if (method === "POST" && path === "/api/tasks") {
    const created = { id: `t-${String(nextId).padStart(2, "0")}`, dueDate: TODAY, done: false, ...body };
    nextId += 1;
    tasks.push(created);
    return answer(201, created);
  }
  const match = path.match(/^\/api\/tasks\/(t-\d+)$/);
  const task = match && tasks.find((item) => item.id === match[1]);
  if (method === "PATCH" && task) {
    Object.assign(task, body);
    return answer(200, task);
  }
  if (method === "DELETE" && task) {
    tasks = tasks.filter((item) => item !== task);
    return answer(200, { id: task.id });
  }
  return answer(404, { error: "not found" });
}

const realFetch = window.fetch;

window.fetch = (input, init = {}) => {
  const url = new URL(input, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  const method = (init.method ?? "GET").toUpperCase();
  const request = { number: requests.length + 1, method, path: url.pathname + url.search };
  requests.push(request);
  console.log(`→ #${request.number} ${method} ${request.path}`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      init.signal?.removeEventListener("abort", onAbort);
      const response = route(method, url, init.body ? JSON.parse(init.body) : undefined);
      console.log(`← #${request.number} ${response.status}`);
      resolve(response);
    }, settings.delayMs);
    function onAbort() {
      clearTimeout(timer);
      console.log(`× #${request.number} aborted`);
      reject(new DOMException("The request was aborted.", "AbortError"));
    }
    init.signal?.addEventListener("abort", onAbort, { once: true });
  });
};
