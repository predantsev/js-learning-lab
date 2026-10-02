import { attempt } from './attempt.js';

function classify(outcome) {
  expect(typeof scope.classifyFailure, 'type of classifyFailure').toBe('function');
  return scope.classifyFailure(outcome);
}

const jsonResponse = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// Loads `url` through attempt() while fetch answers with `spec`.
async function outcomeFor(spec, signal) {
  const server = mockFetch({ '/api/habits': spec });
  try {
    return await attempt('/api/habits', { signal });
  } finally {
    server.restore();
  }
}

test('a response that is not ok is an http-error', () => {
  expect(classify({ response: jsonResponse(404, { error: 'not found' }) }), 'kind for a 404 response').toBe('http-error');
  expect(classify({ response: jsonResponse(500, { error: 'broken' }) }), 'kind for a 500 response').toBe('http-error');
});

test('a fetch rejected with TypeError is a network-error', () => {
  expect(classify({ error: new TypeError('Failed to fetch') }), 'kind for TypeError: Failed to fetch').toBe('network-error');
});

test('a TimeoutError is a timeout and an AbortError is aborted', () => {
  expect(classify({ error: new DOMException('signal timed out', 'TimeoutError') }), 'kind for a TimeoutError').toBe('timeout');
  expect(classify({ error: new DOMException('signal is aborted without reason', 'AbortError') }), 'kind for an AbortError').toBe('aborted');
});

test('an ok response whose body is not JSON is invalid-json', () => {
  expect(classify({ response: new Response('<!doctype html>', { status: 200 }), error: new SyntaxError('Unexpected token') }), 'kind for an ok response with a SyntaxError').toBe('invalid-json');
});

test('a successful load is not a failure', () => {
  expect(classify({ response: jsonResponse(200, { items: [] }), data: { items: [] } }), 'kind for a successful load').toBeNull();
});

test('classifies real outcomes of attempt()', async () => {
  expect(classify(await outcomeFor({ status: 503, body: { error: 'busy' } })), 'kind for a 503 answer').toBe('http-error');
  expect(classify(await outcomeFor({ networkError: true })), 'kind for a network failure').toBe('network-error');
  expect(classify(await outcomeFor({ status: 200, body: 'Not JSON at all', headers: { 'content-type': 'application/json' } })), 'kind for a broken body').toBe('invalid-json');
  const controller = new AbortController();
  const pending = outcomeFor({ status: 200, body: { items: [] }, delay: 300 }, controller.signal);
  await sleep(30);
  controller.abort();
  expect(classify(await pending), 'kind for an aborted load').toBe('aborted');
  expect(classify(await outcomeFor({ status: 200, body: { items: [] }, delay: 300 }, AbortSignal.timeout(50))), 'kind for a timed-out load').toBe('timeout');
});

test('shows a distinct message for each failure and the count for a success', () => {
  expect(typeof scope.showOutcome, 'type of showOutcome').toBe('function');
  const status = screen.$('#status');
  const shown = {};
  const cases = {
    'http-error': { response: jsonResponse(404, {}) },
    'network-error': { error: new TypeError('Failed to fetch') },
    timeout: { error: new DOMException('signal timed out', 'TimeoutError') },
    aborted: { error: new DOMException('aborted', 'AbortError') },
    'invalid-json': { response: new Response('x', { status: 200 }), error: new SyntaxError('x') },
  };
  for (const [kind, outcome] of Object.entries(cases)) {
    scope.showOutcome(outcome);
    shown[kind] = status.textContent;
  }
  expect(shown['http-error'], 'the text for a 404').toBe(`${L.httpError} (404)`);
  expect(shown['network-error'], 'the text for a network failure').toBe(L.networkError);
  expect(shown.timeout, 'the text for a timeout').toBe(L.timeout);
  expect(shown.aborted, 'the text for an aborted load').toBe(L.aborted);
  expect(shown['invalid-json'], 'the text for a body that is not JSON').toBe(L.invalidJson);
  scope.showOutcome({ response: jsonResponse(200, {}), data: { items: [{}, {}, {}] } });
  expect(status.textContent, 'the text for a successful load of 3 habits').toBe(`${L.loaded} 3`);
});
