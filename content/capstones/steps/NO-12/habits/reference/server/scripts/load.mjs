// Synthetic load for a rehearsal: `npm run load -- http://127.0.0.1:4311 5` sends requests from 4 workers
// for 5 seconds: lists (GET /v1/records?limit=50); every 10th request a new habit (POST with an
// Idempotency-Key); and, five requests later, "done" for one of the starting habits h-01…h-06 on a day before
// 2026-03-01 (POST /v1/records/:id/completions — a day sent again in a second run adds nothing). It prints the
// answers by status, the requests that were refused (no connection) or broken (the connection closed
// mid-answer), the 201s (each one is a habit the server confirmed — after a SIGTERM under load, every one of
// them must be on disk), the completions answered 200, and p50/p95 of the answers as the client saw them.
const [base = "http://127.0.0.1:4311", secondsText = "5"] = process.argv.slice(2);
const until = Date.now() + Number(secondsText) * 1000;
const durations = [];
const statuses = {};
let refused = 0;
let broken = 0;
let sent = 0;
let completed = 0;

// The calendar date `offset` days before 2026-03-01, counted in UTC.
const dayBefore = (offset) => new Date(Date.UTC(2026, 2, 1 - offset)).toISOString().slice(0, 10);

async function worker(id) {
  while (Date.now() < until) {
    sent += 1;
    const create = sent % 10 === 0;
    const complete = sent % 10 === 5;
    const step = Math.floor(sent / 10);
    const started = performance.now();
    try {
      const response = await fetch(create ? `${base}/v1/records` : complete ? `${base}/v1/records/h-0${(step % 6) + 1}/completions` : `${base}/v1/records?limit=50`, {
        method: create || complete ? "POST" : "GET",
        headers: create ? { "content-type": "application/json", "idempotency-key": crypto.randomUUID() } : complete ? { "content-type": "application/json" } : {},
        body: create ? JSON.stringify({ name: `Load ${id}-${sent}`, frequency: "daily", active: true }) : complete ? JSON.stringify({ day: dayBefore(step) }) : undefined,
        signal: AbortSignal.timeout(5000),
      });
      await response.text();
      durations.push(performance.now() - started);
      statuses[response.status] = (statuses[response.status] ?? 0) + 1;
      completed += complete && response.status === 200 ? 1 : 0;
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
console.log(`answered ${JSON.stringify(statuses)}, refused ${refused}, broken ${broken}; created (201) ${statuses[201] ?? 0}, completions (200) ${completed}; p50 ${at(50)} ms, p95 ${at(95)} ms`);
