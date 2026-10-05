// Metrics of the records server, served as text at GET /metrics. Per route: a request counter by status, an
// error counter (status 500 and above) and a latency histogram from node:perf_hooks, read as p50, p95 and
// p99. A metric shows what a log line cannot: how many, how often, how slow most requests are — the average
// hides the slow few, a percentile does not. The histogram keeps counts, not every duration, so its memory
// does not grow with the number of requests (it records whole microseconds; its percentile takes the
// nearest rank, which can differ by one rank from "rounded up").
//
// The route label is the route's pattern, never the raw path: /v1/records/h-01 and /v1/records/h-02 are one
// route, and an unknown path is "(other)" — otherwise every probe of a random address would add a label
// and the metrics would grow without a bound.
//
// One metric of the habit tracker itself: habit_completions_recorded_total, the days that "done today"
// (POST /v1/records/:id/completions) really added. A retry of a day that is already there answers 200 too,
// but adds nothing, so it is not counted: the request counter says how often people pressed, this one how
// many completions the store gained.
import { createHistogram } from "node:perf_hooks";
import type { RecordableHistogram } from "node:perf_hooks";

const KNOWN = ["/records", "/livez", "/readyz", "/metrics", "/v1/records", "/v1/export", "/v1/import"];

export function routeLabel(pathname: string): string {
  if (KNOWN.includes(pathname)) {
    return pathname;
  }
  if (/^\/v1\/records\/[^/]+$/.test(pathname)) {
    return "/v1/records/:id";
  }
  if (/^\/v1\/records\/[^/]+\/completions$/.test(pathname)) {
    return "/v1/records/:id/completions";
  }
  return "(other)";
}

export type Metrics = {
  record(route: string, status: number, ms: number): void;
  percentile(route: string, p: number): number | null;
  completionRecorded(): void;
  render(): string;
};

export function createMetrics(): Metrics {
  const requests = new Map<string, number>(); // `${route} ${status}` → count
  const errors = new Map<string, number>(); // route → count of 5xx, a 0 line from the first request on
  const durations = new Map<string, RecordableHistogram>();
  let completionsRecorded = 0;

  function histogramOf(route: string): RecordableHistogram {
    let histogram = durations.get(route);
    if (histogram === undefined) {
      histogram = createHistogram();
      durations.set(route, histogram);
    }
    return histogram;
  }

  return {
    record(route, status, ms) {
      const key = `${route} ${status}`;
      requests.set(key, (requests.get(key) ?? 0) + 1);
      errors.set(route, (errors.get(route) ?? 0) + (status >= 500 ? 1 : 0));
      histogramOf(route).record(Math.max(1, Math.round(ms * 1000)));
    },
    percentile(route, p) {
      const histogram = durations.get(route);
      return histogram === undefined || histogram.count === 0 ? null : histogram.percentile(p) / 1000;
    },
    completionRecorded() {
      completionsRecorded += 1;
    },
    render() {
      const lines: string[] = [`habit_completions_recorded_total ${completionsRecorded}`];
      for (const [key, count] of requests) {
        const [route, status] = key.split(" ");
        lines.push(`http_requests_total{route="${route}",status="${status}"} ${count}`);
      }
      for (const [route, count] of errors) {
        lines.push(`http_errors_total{route="${route}"} ${count}`);
      }
      for (const [route, histogram] of durations) {
        for (const p of [50, 95, 99]) {
          lines.push(`http_request_duration_ms{route="${route}",quantile="${p / 100}"} ${(histogram.percentile(p) / 1000).toFixed(1)}`);
        }
        lines.push(`http_request_duration_ms_count{route="${route}"} ${histogram.count}`);
      }
      return lines.join("\n") + "\n";
    },
  };
}
