// A fake search server for this exercise. Like many real search servers, it answers a short
// query more slowly: there are more results to collect. One letter takes 450 ms, two take 150 ms.
// Every request is printed to the console (→ sent, ← answered, × aborted) and kept in `requests`.
const HABITS = [
  { id: "h-01", name: "%%exercise%%" },
  { id: "h-02", name: "%%read%%" },
  { id: "h-03", name: "%%water%%" },
  { id: "h-04", name: "%%tidy%%" },
  { id: "h-05", name: "%%words%%" },
  { id: "h-06", name: "%%walk%%" },
];

export const settings = { failNext: 0 }; // how many of the next requests fail
export const requests = []; // { number, query, outcome: "pending" | "200" | "503" | "aborted" }

export function searchHabits(query, { signal } = {}) {
  const request = { number: requests.length + 1, query, outcome: "pending" };
  requests.push(request);
  const fails = settings.failNext > 0;
  if (fails) settings.failNext -= 1;
  const delayMs = Math.max(150, 750 - query.length * 300);
  console.log(`→ #${request.number} GET /habits?q=${query}`);
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      request.outcome = "aborted";
      reject(new DOMException("The request was aborted.", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      if (fails) {
        request.outcome = "503";
        console.log(`← #${request.number} 503`);
        reject(new Error("503 Service Unavailable"));
        return;
      }
      const wanted = query.toLowerCase();
      const found = HABITS.filter((habit) => habit.name.toLowerCase().includes(wanted));
      request.outcome = "200";
      console.log(`← #${request.number} 200 [${found.map((habit) => habit.id).join(", ")}]`);
      resolve(structuredClone(found));
    }, delayMs);
    function onAbort() {
      clearTimeout(timer);
      request.outcome = "aborted";
      console.log(`× #${request.number} aborted`);
      reject(new DOMException("The request was aborted.", "AbortError"));
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
