// Request metrics of one service process: counters and latency percentiles per route.

export function createMetrics() {
  return {
    countRequest(route, status) {
      // TODO: count the request by route and status; a status of 500 or more is also an error
    },
    observe(route, ms) {
      // TODO: remember one duration of this route
    },
    percentile(route, p) {
      // TODO: the nearest-rank p-th percentile of this route's durations, or null
      return null;
    },
    render() {
      // TODO: the plain-text lines described in the task
      return '';
    },
  };
}
