// Request metrics of one service process: counters and latency percentiles per route.

export function createMetrics() {
  const requests = new Map(); // `${route} ${status}` → count
  const errors = new Map(); // route → count of responses with status >= 500
  const durations = new Map(); // route → every observed duration in ms

  const percentile = (route, p) => {
    const values = durations.get(route);
    if (!values || values.length === 0) return null;
    const sorted = values.toSorted((a, b) => a - b);
    const index = Math.floor((p / 100) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  };

  return {
    countRequest(route, status) {
      const key = `${route} ${status}`;
      requests.set(key, (requests.get(key) ?? 0) + 1);
      errors.set(route, (errors.get(route) ?? 0) + (status >= 500 ? 1 : 0));
    },
    observe(route, ms) {
      if (!durations.has(route)) durations.set(route, []);
      durations.get(route).push(ms);
    },
    percentile,
    render() {
      const lines = [];
      for (const [key, count] of requests) {
        const [route, status] = key.split(' ');
        lines.push(`http_requests_total{route="${route}",status="${status}"} ${count}`);
      }
      for (const [route, count] of errors) lines.push(`http_errors_total{route="${route}"} ${count}`);
      for (const [route, values] of durations) {
        lines.push(`http_request_duration_ms{route="${route}",quantile="0.5"} ${percentile(route, 50)}`);
        lines.push(`http_request_duration_ms{route="${route}",quantile="0.95"} ${percentile(route, 95)}`);
        lines.push(`http_request_duration_ms_count{route="${route}"} ${values.length}`);
      }
      return lines.join('\n') + '\n';
    },
  };
}
