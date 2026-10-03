// A fake server for this lesson: answers from memory after a delay and can be told to fail.
// Every request is printed to the console: → sent, ← answered, × aborted.
const HABITS = [
  { id: "h-01", name: "%%exercise%%", active: true },
  { id: "h-02", name: "%%read%%", active: true },
  { id: "h-03", name: "%%water%%", active: true },
  { id: "h-06", name: "%%walk%%", active: true },
];

export const settings = {
  delayMs: 700, // how long every answer takes
  failNext: 0, // how many of the next requests fail
};

let sent = 0;

export function fetchHabits({ signal } = {}) {
  sent += 1;
  const number = sent;
  const fails = settings.failNext > 0;
  if (fails) settings.failNext -= 1;
  console.log(`→ #${number} GET /habits`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      if (fails) {
        console.log(`← #${number} 503`);
        reject(new Error("503 Service Unavailable"));
        return;
      }
      console.log(`← #${number} 200 [${HABITS.map((habit) => habit.id).join(", ")}]`);
      resolve(structuredClone(HABITS));
    }, settings.delayMs);
    function onAbort() {
      clearTimeout(timer);
      console.log(`× #${number} aborted`);
      reject(new DOMException("The request was aborted.", "AbortError"));
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
