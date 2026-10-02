// fetch answers with the given list of answers, one per request (the last one repeats).
function answers(list) {
  let index = 0;
  const mock = mockFetch(() => {
    const answer = list[Math.min(index, list.length - 1)];
    index += 1;
    return answer;
  });
  return mock;
}

const OK = { status: 200, body: { ok: true } };
const UNAVAILABLE = { status: 503, body: { error: 'temporary failure' } };
const NOT_FOUND = { status: 404, body: { error: 'not found' } };
const OFFLINE = { networkError: true };

// Records the pauses the learner's code asks setTimeout for (the timers still run for real).
function recordPauses() {
  const real = window.setTimeout;
  const pauses = [];
  window.setTimeout = (fn, ms, ...args) => {
    pauses.push(ms);
    return real(fn, ms, ...args);
  };
  return { pauses, restore: () => { window.setTimeout = real; } };
}

async function outcome(url, options) {
  expect(typeof scope.fetchWithRetry, 'type of fetchWithRetry').toBe('function');
  try {
    return { value: await scope.fetchWithRetry(url, options) };
  } catch (error) {
    return { error };
  }
}

test('returns the response when the first attempt succeeds', async () => {
  const mock = answers([OK]);
  try {
    const result = await outcome('/api/items', { attempts: 3, baseDelayMs: 10 });
    expect(result.value?.status, 'status of the returned response').toBe(200);
    expect(mock.calls.length, 'number of requests').toBe(1);
  } finally {
    mock.restore();
  }
});

test('retries a 503 and returns the answer of the third attempt', async () => {
  const mock = answers([UNAVAILABLE, UNAVAILABLE, OK]);
  try {
    const result = await outcome('/api/items', { attempts: 3, baseDelayMs: 10 });
    expect(result.value?.status, 'status of the returned response').toBe(200);
    expect(mock.calls.length, 'number of requests').toBe(3);
  } finally {
    mock.restore();
  }
});

test('retries after a network error', async () => {
  const mock = answers([OFFLINE, OK]);
  try {
    const result = await outcome('/api/items', { attempts: 3, baseDelayMs: 10 });
    expect(result.value?.status, 'status of the returned response').toBe(200);
    expect(mock.calls.length, 'number of requests').toBe(2);
  } finally {
    mock.restore();
  }
});

test('does not retry a 404 and rejects with its status', async () => {
  const mock = answers([NOT_FOUND, OK]);
  try {
    const result = await outcome('/api/items', { attempts: 3, baseDelayMs: 10 });
    expect(result.error instanceof Error, 'fetchWithRetry rejects with an Error').toBe(true);
    expect(result.error.status, 'the status property of that Error').toBe(404);
    expect(mock.calls.length, 'number of requests').toBe(1);
  } finally {
    mock.restore();
  }
});

test('gives up after the given number of attempts with an Error', async () => {
  const mock = answers([UNAVAILABLE]);
  try {
    const result = await outcome('/api/items', { attempts: 3, baseDelayMs: 10 });
    expect(result.error instanceof Error, 'after three 503 answers fetchWithRetry rejects with an Error').toBe(true);
    expect(mock.calls.length, 'number of requests with attempts: 3').toBe(3);
  } finally {
    mock.restore();
  }
  const second = answers([OFFLINE]);
  try {
    const result = await outcome('/api/items', { attempts: 2, baseDelayMs: 10 });
    expect(result.error instanceof Error, 'after two network errors fetchWithRetry rejects with an Error').toBe(true);
    expect(second.calls.length, 'number of requests with attempts: 2').toBe(2);
  } finally {
    second.restore();
  }
});

test('waits longer before each next attempt', async () => {
  const mock = answers([UNAVAILABLE]);
  const recorder = recordPauses();
  try {
    await outcome('/api/items', { attempts: 3, baseDelayMs: 10 });
  } finally {
    recorder.restore();
    mock.restore();
  }
  expect(recorder.pauses.length, 'number of pauses between three attempts').toBe(2);
  expect(recorder.pauses[0] >= 10, `the first pause (${recorder.pauses[0]} ms) is at least baseDelayMs`).toBe(true);
  expect(recorder.pauses[1] > recorder.pauses[0], `the second pause (${recorder.pauses[1]} ms) is longer than the first`).toBe(true);
});
