// Request metrics: a counter per route and status, and latency percentiles per route.
import { createHistogram, type RecordableHistogram } from 'node:perf_hooks';

export type Metrics = { record(route: string, status: number, ms: number): void; text(): string };

export function createMetrics(): Metrics {
  const requests = new Map<string, number>();
  const latency = new Map<string, RecordableHistogram>();
  return {
    record(route, status, ms) {
      const key = `${route} ${status}`;
      requests.set(key, (requests.get(key) ?? 0) + 1);
      if (!latency.has(route)) latency.set(route, createHistogram());
      latency.get(route)!.record(Math.max(1, Math.round(ms * 1000)));
    },
    text() {
      const lines: string[] = [];
      for (const [key, count] of requests) {
        const [route, status] = key.split(' ');
        lines.push(`http_requests_total{route="${route}",status="${status}"} ${count}`);
      }
      for (const [route, histogram] of latency) {
        for (const q of [50, 95]) lines.push(`http_request_duration_ms{route="${route}",quantile="${q / 100}"} ${(histogram.percentile(q) / 1000).toFixed(1)}`);
      }
      return lines.join('\n') + '\n';
    },
  };
}
