// A fake server for this exercise. There is no network here: the answer comes from memory
// after a timer. The checks change `settings` to make it fast or to make it fail.
// Every request is printed to the console and recorded in `requests`.
const TASKS = [
  { id: "t-01", title: "%%plants%%", dueDate: "2026-03-02", done: false },
  { id: "t-02", title: "%%library%%", dueDate: "2026-03-01", done: false },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false },
  { id: "t-04", title: "%%internet%%", dueDate: "2026-02-27", done: true },
];

export const settings = {
  delayMs: 600, // how long every answer takes
  failNext: 0, // how many of the next requests fail
};

export const requests = [];

export function fetchTasks() {
  const number = requests.length + 1;
  const fails = settings.failNext > 0;
  if (fails) settings.failNext -= 1;
  requests.push(number);
  console.log(`→ #${number} GET /tasks`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fails) {
        console.log(`← #${number} 503`);
        reject(new Error("503 Service Unavailable"));
        return;
      }
      console.log(`← #${number} 200 [${TASKS.map((task) => task.id).join(", ")}]`);
      resolve(structuredClone(TASKS));
    }, settings.delayMs);
  });
}
