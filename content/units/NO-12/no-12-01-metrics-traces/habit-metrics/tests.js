import { createApp } from './app.js';
import { createMetrics } from './metrics.js';

const guard = () => expect(typeof createMetrics, 'type of createMetrics').toBe('function');
const linesOf = (metrics) => String(metrics.render()).split('\n').map((line) => line.trim()).filter(Boolean);

test('counts requests per route and status', () => {
  guard();
  const metrics = createMetrics();
  for (let i = 0; i < 3; i++) metrics.countRequest('/habits', 200);
  metrics.countRequest('/habits', 201);
  metrics.countRequest('/habits/h-07', 404);
  const lines = linesOf(metrics);
  expect(lines, 'lines of render()').toContain('http_requests_total{route="/habits",status="200"} 3');
  expect(lines, 'lines of render()').toContain('http_requests_total{route="/habits",status="201"} 1');
  expect(lines, 'lines of render()').toContain('http_requests_total{route="/habits/h-07",status="404"} 1');
});

test('counts only statuses of 500 and above as errors', () => {
  guard();
  const metrics = createMetrics();
  metrics.countRequest('/habits', 200);
  metrics.countRequest('/habits', 404);
  metrics.countRequest('/habits', 400);
  metrics.countRequest('/habits', 500);
  metrics.countRequest('/habits', 503);
  expect(linesOf(metrics), 'lines of render()').toContain('http_errors_total{route="/habits"} 2');
});

test('shows 0 errors for a route that had none', () => {
  guard();
  const metrics = createMetrics();
  metrics.countRequest('/habits/summary', 200);
  metrics.countRequest('/habits/summary', 200);
  expect(linesOf(metrics), 'lines of render()').toContain('http_errors_total{route="/habits/summary"} 0');
});

test('percentile uses the nearest rank of the sorted durations', () => {
  guard();
  const metrics = createMetrics();
  for (const ms of [40, 15, 35, 5, 50, 20, 10, 45, 30, 25]) metrics.observe('/habits', ms);
  expect(metrics.percentile('/habits', 50), 'p50 of 5, 10 … 50').toBe(25);
  expect(metrics.percentile('/habits', 90), 'p90 of 5, 10 … 50').toBe(45);
  expect(metrics.percentile('/habits', 95), 'p95 of 5, 10 … 50').toBe(50);
  const tail = createMetrics();
  for (let i = 0; i < 96; i++) tail.observe('/habits', 12);
  for (let i = 0; i < 4; i++) tail.observe('/habits', 700);
  expect(tail.percentile('/habits', 95), 'p95 of 96 × 12 ms and 4 × 700 ms').toBe(12);
  expect(tail.percentile('/habits', 97), 'p97 of 96 × 12 ms and 4 × 700 ms').toBe(700);
  // 11 durations: ⌈0.95 × 11⌉ = ⌈10.45⌉ = 11, so p95 is the 11th (the largest) value, not the 10th.
  const eleven = createMetrics();
  for (const ms of [110, 10, 100, 20, 90, 30, 80, 40, 70, 50, 60]) eleven.observe('/habits', ms);
  expect(eleven.percentile('/habits', 95), 'p95 of 10, 20 … 110 (11 durations)').toBe(110);
  expect(eleven.percentile('/habits', 40), 'p40 of 10, 20 … 110 (11 durations)').toBe(50);
});

test('percentile of a route without durations is null', () => {
  guard();
  const metrics = createMetrics();
  metrics.observe('/habits', 20);
  expect(metrics.percentile('/habits/summary', 95), 'p95 of a route with no durations').toBe(null);
});

test('durations of different routes are kept apart', () => {
  guard();
  const metrics = createMetrics();
  for (let i = 0; i < 10; i++) metrics.observe('/habits', 8);
  for (let i = 0; i < 10; i++) metrics.observe('/habits/summary', 600);
  expect(metrics.percentile('/habits', 95), 'p95 of /habits').toBe(8);
  expect(metrics.percentile('/habits/summary', 50), 'p50 of /habits/summary').toBe(600);
});

test('render shows p50, p95 and the count of every observed route', () => {
  guard();
  const metrics = createMetrics();
  for (const ms of [30, 10, 20, 900]) metrics.observe('/habits', ms);
  metrics.observe('/habits/summary', 7);
  const lines = linesOf(metrics);
  for (const route of ['/habits', '/habits/summary']) {
    expect(lines, 'lines of render()').toContain(`http_request_duration_ms{route="${route}",quantile="0.5"} ${metrics.percentile(route, 50)}`);
    expect(lines, 'lines of render()').toContain(`http_request_duration_ms{route="${route}",quantile="0.95"} ${metrics.percentile(route, 95)}`);
  }
  expect(lines, 'lines of render()').toContain('http_request_duration_ms_count{route="/habits"} 4');
  expect(lines, 'lines of render()').toContain('http_request_duration_ms_count{route="/habits/summary"} 1');
});

test('GET /metrics answers 200 with the rendered text', async () => {
  guard();
  const metrics = createMetrics();
  metrics.countRequest('/habits', 200);
  metrics.observe('/habits', 11);
  const response = await request(`${await listen(createApp(metrics))}/metrics`);
  expect(response.status, 'status of GET /metrics').toBe(200);
  expect(response.headers['content-type'], 'content-type of GET /metrics').toMatch(/^text\/plain/);
  expect(response.text, 'body of GET /metrics').toBe(metrics.render());
  expect(response.text, 'body of GET /metrics').toMatch(/http_requests_total\{route="\/habits",status="200"\} 1/);
});
