// Synthetic load for the planner service: `node scripts/load.mjs <base-url> [seconds]`.
// Sends GET /tasks (and every 10th time POST /tasks) with 4 requests at a time and reports how each
// one ended: answered (with status), refused (no connection) or broken (connection cut mid-request).
const [base = 'http://127.0.0.1:7330', seconds = '3'] = process.argv.slice(2);
const until = Date.now() + Number(seconds) * 1000;
const results = { answered: {}, refused: 0, broken: 0 };
const durations = [];
let n = 0;

async function worker() {
  while (Date.now() < until) {
    const post = ++n % 10 === 0;
    const started = performance.now();
    try {
      const response = await fetch(`${base}/tasks`, post
        ? { method: 'POST', body: JSON.stringify({ title: `Load task ${n}` }), signal: AbortSignal.timeout(5000) }
        : { signal: AbortSignal.timeout(5000) });
      await response.arrayBuffer();
      results.answered[response.status] = (results.answered[response.status] ?? 0) + 1;
      durations.push(performance.now() - started);
    } catch (error) {
      if (error.cause?.code === 'ECONNREFUSED') {
        results.refused += 1;
        await new Promise((resolve) => setTimeout(resolve, 50));
      } else {
        results.broken += 1;
      }
    }
  }
}

await Promise.all([worker(), worker(), worker(), worker()]);
const sorted = durations.toSorted((a, b) => a - b);
const at = (p) => (sorted.length ? sorted[Math.ceil((p / 100) * sorted.length) - 1].toFixed(1) : '-');
console.log(`answered ${JSON.stringify(results.answered)}, refused ${results.refused}, broken ${results.broken}; p50 ${at(50)} ms, p95 ${at(95)} ms`);
