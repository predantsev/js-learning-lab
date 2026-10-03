// A fake server for this lesson: answers from memory after a delay that depends on the filter.
// Every request is printed to the console: → sent, ← answered, × aborted.
const TASKS = [
  { id: "t-01", title: "%%plants%%", done: false },
  { id: "t-02", title: "%%library%%", done: false },
  { id: "t-03", title: "%%grandma%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
  { id: "t-05", title: "%%dentist%%", done: false },
  { id: "t-06", title: "%%wardrobe%%", done: true },
];

// How long the answer for each filter takes, in milliseconds.
export const delays = { all: 1200, pending: 200, done: 200 };

let sent = 0;

export function listTasks(filter, { signal } = {}) {
  sent += 1;
  const number = sent;
  console.log(`→ #${number} GET /tasks?filter=${filter}`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      const found = TASKS.filter((task) => filter === "all" || task.done === (filter === "done"));
      console.log(`← #${number} 200 [${found.map((task) => task.id).join(", ")}]`);
      resolve(structuredClone(found));
    }, delays[filter]);
    function onAbort() {
      clearTimeout(timer);
      console.log(`× #${number} aborted`);
      reject(new DOMException("The request was aborted.", "AbortError"));
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
