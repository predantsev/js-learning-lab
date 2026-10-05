// Request metrics of one service process, kept per route in plain objects.

export function createMetrics() {
  const routes = {}; // route → { statuses: { [status]: count }, errors, durations: [] }

  function routeOf(route) {
    routes[route] ??= { statuses: {}, errors: 0, durations: [] };
    return routes[route];
  }

  function percentile(route, p) {
    const durations = routes[route]?.durations ?? [];
    if (durations.length === 0) return null;
    const sorted = [...durations].sort((a, b) => a - b);
    const place = Math.ceil((p * sorted.length) / 100); // counted from 1
    return sorted[Math.max(place, 1) - 1];
  }

  return {
    countRequest(route, status) {
      const entry = routeOf(route);
      entry.statuses[status] = (entry.statuses[status] ?? 0) + 1;
      if (status >= 500) entry.errors++;
    },
    observe(route, ms) {
      routeOf(route).durations.push(ms);
    },
    percentile,
    render() {
      const lines = [];
      for (const [route, entry] of Object.entries(routes)) {
        const statuses = Object.entries(entry.statuses);
        for (const [status, count] of statuses) lines.push(`http_requests_total{route="${route}",status="${status}"} ${count}`);
        if (statuses.length > 0) lines.push(`http_errors_total{route="${route}"} ${entry.errors}`);
        if (entry.durations.length > 0) {
          lines.push(`http_request_duration_ms{route="${route}",quantile="0.5"} ${percentile(route, 50)}`);
          lines.push(`http_request_duration_ms{route="${route}",quantile="0.95"} ${percentile(route, 95)}`);
          lines.push(`http_request_duration_ms_count{route="${route}"} ${entry.durations.length}`);
        }
      }
      return lines.join('\n');
    },
  };
}
