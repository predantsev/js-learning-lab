// A fake server for this exercise: answers from memory after a delay and can be told to fail.
// The checks change `settings`. Every request is printed to the console and kept in `requests`.
const EXPENSES = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, category: "food" },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000, category: "transport" },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000, category: "fun" },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990, category: "home" },
];

export const settings = {
  delayMs: 600, // how long every answer takes
  failNext: 0, // how many of the next requests fail
};

export const requests = []; // { number, outcome: "pending" | "200" | "503" | "aborted" }

export function fetchExpenses({ signal } = {}) {
  const request = { number: requests.length + 1, outcome: "pending" };
  requests.push(request);
  const fails = settings.failNext > 0;
  if (fails) settings.failNext -= 1;
  console.log(`→ #${request.number} GET /expenses`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      if (fails) {
        request.outcome = "503";
        console.log(`← #${request.number} 503`);
        reject(new Error("503 Service Unavailable"));
        return;
      }
      request.outcome = "200";
      console.log(`← #${request.number} 200 [${EXPENSES.map((expense) => expense.id).join(", ")}]`);
      resolve(structuredClone(EXPENSES));
    }, settings.delayMs);
    function onAbort() {
      clearTimeout(timer);
      request.outcome = "aborted";
      console.log(`× #${request.number} aborted`);
      reject(new DOMException("The request was aborted.", "AbortError"));
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
