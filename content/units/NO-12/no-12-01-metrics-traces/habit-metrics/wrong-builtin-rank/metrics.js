// Request metrics of one service process, with Node's built-in histogram (perf_hooks).
// A natural attempt that looks right: the histogram has percentile(), but it rounds the place
// p / 100 × n to the nearest whole place instead of up, so on some counts it is one place lower
// than the nearest rank (11 durations: its p95 is the 10th value, the nearest rank is the 11th;
// measured on Node v25.2.1 and v22.13.1).
import { createHistogram } from 'node:perf_hooks';

export function createMetrics() {
  const routes = new Map(); // route → { statuses: Map, errors, histogram }
  const routeOf = (route) => {
    if (!routes.has(route)) routes.set(route, { statuses: new Map(), errors: 0, histogram: createHistogram() });
    return routes.get(route);
  };

  const percentile = (route, p) => {
    const entry = routes.get(route);
    if (!entry || entry.histogram.count === 0) return null;
    return entry.histogram.percentile(p);
  };

  return {
    countRequest(route, status) {
      const entry = routeOf(route);
      entry.statuses.set(status, (entry.statuses.get(status) ?? 0) + 1);
      if (status >= 500) entry.errors += 1;
    },
    observe(route, ms) {
      routeOf(route).histogram.record(Math.max(1, Math.round(ms)));
    },
    percentile,
    render() {
      let text = '';
      for (const [route, entry] of routes) {
        for (const [status, count] of entry.statuses) text += `http_requests_total{route="${route}",status="${status}"} ${count}\n`;
        if (entry.statuses.size > 0) text += `http_errors_total{route="${route}"} ${entry.errors}\n`;
        if (entry.histogram.count > 0) {
          text += `http_request_duration_ms{route="${route}",quantile="0.5"} ${percentile(route, 50)}\n`;
          text += `http_request_duration_ms{route="${route}",quantile="0.95"} ${percentile(route, 95)}\n`;
          text += `http_request_duration_ms_count{route="${route}"} ${entry.histogram.count}\n`;
        }
      }
      return text;
    },
  };
}
