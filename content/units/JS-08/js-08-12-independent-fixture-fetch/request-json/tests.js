const JSON_OK = { status: 200, body: { results: [{ id: 'b-01' }] } };
const UNAVAILABLE = { status: 503, body: { error: 'temporary failure' } };

// fetch answers with the given list of answers, one per request (the last one repeats).
function answers(list) {
  let index = 0;
  return mockFetch(() => {
    const answer = list[Math.min(index, list.length - 1)];
    index += 1;
    return answer;
  });
}

async function outcome(url, signal) {
  expect(typeof scope.requestJson, 'type of requestJson').toBe('function');
  try {
    return { value: await scope.requestJson(url, signal) };
  } catch (error) {
    return { error };
  }
}

function recordPauses() {
  const real = window.setTimeout;
  const pauses = [];
  window.setTimeout = (fn, ms, ...args) => {
    pauses.push(ms);
    return real(fn, ms, ...args);
  };
  return { pauses, restore: () => { window.setTimeout = real; } };
}

const header = (call, name) => {
  const headers = call.headers ?? {};
  if (headers instanceof Headers) return headers.get(name);
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key === undefined ? null : headers[key];
};

test('sends a GET request that asks for JSON', async () => {
  const mock = answers([JSON_OK]);
  try {
    await outcome('/api/catalog');
    expect(mock.calls[0]?.method, 'the method of the request').toBe('GET');
    expect(header(mock.calls[0] ?? {}, 'accept'), 'the Accept header of the request').toBe('application/json');
  } finally {
    mock.restore();
  }
});

test('returns the parsed body of a JSON answer', async () => {
  const mock = answers([JSON_OK]);
  try {
    const result = await outcome('/api/catalog');
    expect(result.value, 'the result for a 200 JSON answer').toEqual({ results: [{ id: 'b-01' }] });
  } finally {
    mock.restore();
  }
});

test('rejects a 404 at once with its status', async () => {
  const mock = answers([{ status: 404, body: { error: 'missing' } }, JSON_OK]);
  try {
    const result = await outcome('/api/catalog');
    expect(result.error instanceof Error, 'the 404 is rejected with an Error').toBe(true);
    expect(result.error.status, 'the status property of that Error').toBe(404);
    expect(mock.calls.length, 'number of requests').toBe(1);
  } finally {
    mock.restore();
  }
});

test('retries a 503 at most twice', async () => {
  let mock = answers([UNAVAILABLE, UNAVAILABLE, JSON_OK]);
  try {
    const result = await outcome('/api/catalog');
    expect(result.value, 'the result after two 503 answers and a 200').toEqual({ results: [{ id: 'b-01' }] });
    expect(mock.calls.length, 'number of requests').toBe(3);
  } finally {
    mock.restore();
  }
  mock = answers([UNAVAILABLE]);
  try {
    const result = await outcome('/api/catalog');
    expect(result.error?.status, 'the status of the Error after three 503 answers').toBe(503);
    expect(mock.calls.length, 'number of requests when the server keeps answering 503').toBe(3);
  } finally {
    mock.restore();
  }
});

test('waits longer before each next attempt', async () => {
  const mock = answers([UNAVAILABLE]);
  const recorder = recordPauses();
  try {
    await outcome('/api/catalog');
  } finally {
    recorder.restore();
    mock.restore();
  }
  expect(recorder.pauses.length, 'number of pauses between three attempts').toBe(2);
  expect(recorder.pauses[1] > recorder.pauses[0], `the second pause (${recorder.pauses[1]} ms) is longer than the first (${recorder.pauses[0]} ms)`).toBe(true);
});

test('rejects an answer whose Content-Type is not JSON', async () => {
  const mock = answers([{ status: 200, body: '{"results": []}', headers: { 'content-type': 'text/html' } }]);
  try {
    const result = await outcome('/api/catalog');
    expect(result.error instanceof Error, 'a text/html answer is rejected with an Error').toBe(true);
  } finally {
    mock.restore();
  }
});

test('passes the signal on, so an aborted request rejects with AbortError', async () => {
  const mock = answers([{ ...JSON_OK, delay: 200 }]);
  try {
    const controller = new AbortController();
    const pending = outcome('/api/catalog', controller.signal);
    await sleep(20);
    controller.abort();
    const result = await pending;
    expect(result.error?.name, 'the name of the error after abort()').toBe('AbortError');
  } finally {
    mock.restore();
  }
});
