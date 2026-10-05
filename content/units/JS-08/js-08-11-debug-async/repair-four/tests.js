const text = (selector) => screen.$(selector).textContent.trim();

// fetch answers by path: `answers` maps a part of the address to an answer (or a function of the URL).
function server(answers) {
  return mockFetch((url) => {
    const key = Object.keys(answers).find((part) => url.pathname.includes(part));
    const answer = answers[key];
    return typeof answer === 'function' ? answer(url) : answer ?? { status: 404, body: 'Not found', headers: { 'content-type': 'text/plain' } };
  });
}

function requireFunction(name) {
  expect(typeof scope[name], `type of ${name}`).toBe('function');
}

async function settledValue(promise) {
  try {
    return { value: await promise };
  } catch (error) {
    return { error };
  }
}

test('saveAndConfirm says it saved only after the server answered', async () => {
  requireFunction('saveAndConfirm');
  const mock = server({ echo: { status: 200, body: { ok: true }, delay: 150 } });
  try {
    const pending = scope.saveAndConfirm('w-07');
    await sleep(20);
    expect(text('#status'), 'the status while the save request is still running').toBe(L.saving);
    const result = await settledValue(pending);
    expect(result.error?.message, 'the error of saveAndConfirm').toBeUndefined();
    expect(text('#status'), 'the status after the server answered').toBe(L.saved);
  } finally {
    mock.restore();
  }
});

test('saveAndConfirm shows the failure text when the save fails', async () => {
  requireFunction('saveAndConfirm');
  const mock = server({ echo: { status: 500, body: { message: 'broken' }, delay: 20 } });
  try {
    const result = await settledValue(scope.saveAndConfirm('w-07'));
    expect(result.error?.message, 'saveAndConfirm must not reject').toBeUndefined();
    expect(text('#status'), 'the status after a failed save').toBe(L.saveFailed);
  } finally {
    mock.restore();
  }
});

test('loadTips gives the tips when the server has them', async () => {
  requireFunction('loadTips');
  const mock = server({ tips: { status: 200, body: ['tip 1', 'tip 2'] } });
  try {
    const result = await settledValue(scope.loadTips());
    expect(result.value, 'loadTips() with a tips file').toEqual(['tip 1', 'tip 2']);
  } finally {
    mock.restore();
  }
});

test('loadTips gives an empty list instead of a rejection', async () => {
  requireFunction('loadTips');
  let mock = server({});
  try {
    const result = await settledValue(scope.loadTips());
    expect(result.error?.message, 'loadTips() rejected for a missing file').toBeUndefined();
    expect(result.value, 'loadTips() for a missing file').toEqual([]);
  } finally {
    mock.restore();
  }
  mock = server({ tips: { networkError: true } });
  try {
    const result = await settledValue(scope.loadTips());
    expect(result.error?.message, 'loadTips() rejected without a network').toBeUndefined();
    expect(result.value, 'loadTips() without a network').toEqual([]);
  } finally {
    mock.restore();
  }
});

test('showStats shows the total for a 200 answer', async () => {
  requireFunction('showStats');
  const mock = server({ status: { status: 200, body: { total: 6 } } });
  try {
    await settledValue(scope.showStats());
    expect(text('#stats'), 'the stats text after a 200 answer').toBe(`${L.total} 6`);
  } finally {
    mock.restore();
  }
});

test('showStats shows the error text for a 500 answer', async () => {
  requireFunction('showStats');
  const mock = server({ status: { status: 500, body: { status: 500, ok: false } } });
  try {
    await settledValue(scope.showStats());
    expect(text('#stats'), 'the stats text after a 500 answer').toBe(L.statsError);
  } finally {
    mock.restore();
  }
});

test('only the latest search result stays on the page', async () => {
  requireFunction('search');
  const mock = server({
    search: (url) => {
      const query = url.searchParams.get('q');
      const count = query === L.shortQuery ? 5 : 1;
      return { status: 200, body: { results: Array.from({ length: count }, (_, i) => ({ id: `w-${i}` })) }, delay: query === L.shortQuery ? 200 : 30 };
    },
  });
  try {
    const first = scope.search(L.shortQuery, 600);
    await sleep(5);
    const second = scope.search(L.longQuery, 100);
    await Promise.all([settledValue(first), settledValue(second)]);
    await sleep(50);
    expect(text('#results'), 'the results text after both searches').toBe(`${L.longQuery}: 1`);
  } finally {
    mock.restore();
  }
});
