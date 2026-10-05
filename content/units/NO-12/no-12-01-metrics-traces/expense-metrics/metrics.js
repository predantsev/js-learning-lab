// Metrics of the service: a request counter per route and status, and a latency histogram per
// route. The histogram is Node's built-in one (perf_hooks); it stores whole numbers, so it records
// microseconds and reports milliseconds.
import { createHistogram } from 'node:perf_hooks';

export function createMetrics() {
  const requests = new Map(); // `${route} ${status}` → count
  const latency = new Map(); // route → { histogram, sumMs }

  return {
    record(route, status, ms) {
      const key = `${route} ${status}`;
      requests.set(key, (requests.get(key) ?? 0) + 1);
      if (!latency.has(route)) latency.set(route, { histogram: createHistogram(), sumMs: 0 });
      const entry = latency.get(route);
      entry.histogram.record(Math.max(1, Math.round(ms * 1000)));
      entry.sumMs += ms;
    },
    // Plain text, one value per line, in the style of the Prometheus text format.
    text() {
      const lines = [];
      for (const [key, count] of requests) {
        const [route, status] = key.split(' ');
        lines.push(`http_requests_total{route="${route}",status="${status}"} ${count}`);
      }
      for (const [route, { histogram, sumMs }] of latency) {
        for (const q of [50, 95, 99]) {
          const ms = histogram.percentile(q) / 1000;
          lines.push(`http_request_duration_ms{route="${route}",quantile="${q / 100}"} ${ms.toFixed(1)}`);
        }
        lines.push(`http_request_duration_ms_sum{route="${route}"} ${sumMs.toFixed(1)}`);
        lines.push(`http_request_duration_ms_count{route="${route}"} ${histogram.count}`);
      }
      return lines.join('\n') + '\n';
    },
  };
}
