// classifyFailure on real failures from loopback servers, and the retry table.
import http from 'node:http';
import { classifyFailure, shouldRetry } from './failures.js';

const classify = (failure) => {
  expect(typeof classifyFailure, 'type of classifyFailure').toBe('function');
  return classifyFailure(failure);
};
const retry = (kind, request) => {
  expect(typeof shouldRetry, 'type of shouldRetry').toBe('function');
  return shouldRetry(kind, request);
};
async function rejection(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('the request did not fail');
}
const statusServer = (status) => http.createServer((request, response) => {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end('{}');
});

test('a fetch to a stopped server is unavailable', async () => {
  const gone = http.createServer();
  const url = await listen(gone);
  await new Promise((resolve) => gone.close(resolve));
  const error = await rejection(fetch(`${url}/v1/records`));
  expect(classify(error), `kind of ${error.name}`).toBe('unavailable');
});

test('a timeout is unavailable', async () => {
  const url = await listen(http.createServer(() => {}));
  const error = await rejection(fetch(`${url}/v1/records`, { signal: AbortSignal.timeout(100) }));
  expect(classify(error), `kind of ${error.name}`).toBe('unavailable');
});

test('an answer with an error status is http', async () => {
  expect(classify(await fetch(`${await listen(statusServer(500))}/v1/records`)), 'kind of a 500 answer').toBe('http');
  expect(classify(await fetch(`${await listen(statusServer(404))}/v1/records`)), 'kind of a 404 answer').toBe('http');
});

test('OfflineError is offline and InvalidResponseError is invalid', () => {
  expect(classify(Object.assign(new Error('no network'), { name: 'OfflineError' })), 'kind of OfflineError').toBe('offline');
  expect(classify(Object.assign(new Error('bad body'), { name: 'InvalidResponseError' })), 'kind of InvalidResponseError').toBe('invalid');
});

test('GET is retried after unavailable and after a 5xx', () => {
  expect(retry('unavailable', { method: 'GET' }), 'GET, unavailable').toBe(true);
  expect(retry('http', { method: 'GET', status: 503 }), 'GET, 503').toBe(true);
  expect(retry('http', { method: 'GET', status: 500 }), 'GET, 500').toBe(true);
});

test('a 4xx answer is never retried', () => {
  for (const status of [400, 404, 422]) {
    expect(retry('http', { method: 'GET', status }), `GET, ${status}`).toBe(false);
    expect(retry('http', { method: 'POST', status, idempotencyKey: 'k-1' }), `POST with a key, ${status}`).toBe(false);
  }
});

test('offline and invalid are never retried', () => {
  for (const kind of ['offline', 'invalid']) {
    expect(retry(kind, { method: 'GET' }), `GET, ${kind}`).toBe(false);
    expect(retry(kind, { method: 'POST', idempotencyKey: 'k-1' }), `POST with a key, ${kind}`).toBe(false);
  }
});

test('PUT, DELETE and HEAD are retried like GET', () => {
  for (const method of ['PUT', 'DELETE', 'HEAD']) {
    expect(retry('unavailable', { method }), `${method}, unavailable`).toBe(true);
    expect(retry('http', { method, status: 503 }), `${method}, 503`).toBe(true);
  }
});

test('POST and PATCH are retried only with an idempotency key', () => {
  expect(retry('unavailable', { method: 'POST' }), 'POST without a key, unavailable').toBe(false);
  expect(retry('unavailable', { method: 'PATCH' }), 'PATCH without a key, unavailable').toBe(false);
  expect(retry('http', { method: 'POST', status: 503 }), 'POST without a key, 503').toBe(false);
  expect(retry('unavailable', { method: 'POST', idempotencyKey: 'k-1' }), 'POST with a key, unavailable').toBe(true);
  expect(retry('http', { method: 'PATCH', status: 503, idempotencyKey: 'k-2' }), 'PATCH with a key, 503').toBe(true);
});
