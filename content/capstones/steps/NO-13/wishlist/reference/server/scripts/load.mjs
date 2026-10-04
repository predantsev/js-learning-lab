// Synthetic load for a rehearsal: `npm run load -- http://127.0.0.1:4311 5` sends requests from 4 workers
// for 5 seconds: lists (GET /v1/records?limit=50) and, every 10th request, a new wish (POST with an
// Idempotency-Key). It prints the answers by status, the requests that were refused (no connection) or
// broken (the connection closed mid-answer), the 201s (each one is a wish the server confirmed — after a
// SIGTERM under load, every one of them must be on disk), and p50/p95 of the answers as the client saw them.
const [base = "http://127.0.0.1:4311", secondsText = "5"] = process.argv.slice(2);
const until = Date.now() + Number(secondsText) * 1000;
const durations = [];
const statuses = {};
let refused = 0;
let broken = 0;
let sent = 0;

async function worker(id) {
  while (Date.now() < until) {
    sent += 1;
    const create = sent % 10 === 0;
    const started = performance.now();
    try {
      const response = await fetch(create ? `${base}/v1/records` : `${base}/v1/records?limit=50`, {
        method: create ? "POST" : "GET",
        headers: create ? { "content-type": "application/json", "idempotency-key": crypto.randomUUID() } : {},
        body: create ? JSON.stringify({ name: `Load ${id}-${sent}`, price: 10, acquired: false, category: null }) : undefined,
        signal: AbortSignal.timeout(5000),
      });
      await response.text();
      durations.push(performance.now() - started);
      statuses[response.status] = (statuses[response.status] ?? 0) + 1;
    } catch (error) {
      if (error.cause?.code === "ECONNREFUSED") {
        refused += 1;
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        broken += 1;
      }
    }
  }
}

await Promise.all([1, 2, 3, 4].map(worker));
const sorted = durations.toSorted((a, b) => a - b);
const at = (p) => (sorted.length === 0 ? null : sorted[Math.max(1, Math.ceil((p / 100) * sorted.length)) - 1].toFixed(1));
console.log(`answered ${JSON.stringify(statuses)}, refused ${refused}, broken ${broken}; created (201) ${statuses[201] ?? 0}; p50 ${at(50)} ms, p95 ${at(95)} ms`);
