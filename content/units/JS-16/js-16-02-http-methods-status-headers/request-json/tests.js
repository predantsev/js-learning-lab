// Calls requestJson; a thrown error fails the check, because the function must return a result instead.
async function call(url, options) {
  expect(typeof scope.requestJson, 'type of requestJson').toBe('function');
  let thrown = null;
  let result;
  try {
    result = await scope.requestJson(url, options);
  } catch (error) {
    thrown = error;
  }
  expect(thrown === null ? null : String(thrown), 'what requestJson threw (it must return a result instead)').toBeNull();
  return result;
}

// Runs `fn` while fetch answers with `spec`; returns the request options fetch received.
async function withAnswer(spec, fn) {
  const seen = [];
  const server = mockFetch((url, init) => {
    seen.push(init ?? {});
    return spec;
  });
  try {
    await fn();
  } finally {
    server.restore();
  }
  return seen;
}

const json = (status, body) => ({ status, body, headers: { 'content-type': 'application/json; charset=utf-8' } });

test('asks for JSON with an Accept header', async () => {
  const seen = await withAnswer(json(200, []), () => call('/api/wishes'));
  expect(seen.length, 'number of requests').toBe(1);
  expect(new Headers(seen[0].headers).get('accept'), 'the Accept header of the request').toBe('application/json');
  expect((seen[0].method ?? 'GET').toUpperCase(), 'the method of the request').toBe('GET');
});

test('keeps the method, the body and other headers it was given', async () => {
  const body = JSON.stringify({ name: L.lamp, price: 45 });
  const seen = await withAnswer(json(200, { id: 'w-02' }), () => call('/api/wishes/w-02', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body }));
  const headers = new Headers(seen[0].headers);
  expect(seen[0].method, 'the method of the request').toBe('PUT');
  expect(seen[0].body, 'the body of the request').toBe(body);
  expect(headers.get('content-type'), 'the Content-Type header the caller gave').toBe('application/json');
  expect(headers.get('accept'), 'the Accept header of the request').toBe('application/json');
});

test('returns ok and the parsed value for a JSON answer', async () => {
  const fixture = await call('./data/wishes.json');
  expect(fixture, 'the result for data/wishes.json').toMatchObject({ ok: true });
  expect(fixture.value.map((wish) => wish.name), 'names in the parsed value').toEqual([L.headphones, L.lamp]);
  let created;
  await withAnswer(json(201, { id: 'w-07' }), async () => { created = await call('/api/wishes', { method: 'POST' }); });
  expect(created, 'the result for a 201 answer').toEqual({ ok: true, value: { id: 'w-07' } });
});

test('reports the status of an answer that is not ok', async () => {
  const missing = await call('./data/missing.json');
  expect(missing, 'the result for a missing file').toEqual({ ok: false, error: { reason: 'status', status: 404 } });
  let broken;
  await withAnswer(json(500, { message: 'broken' }), async () => { broken = await call('/api/wishes'); });
  expect(broken, 'the result for a 500 answer').toEqual({ ok: false, error: { reason: 'status', status: 500 } });
});

test('refuses a 200 page that is not JSON', async () => {
  let result;
  await withAnswer({ status: 200, body: '<!doctype html><title>App</title>', headers: { 'content-type': 'text/html; charset=utf-8' } }, async () => {
    result = await call('/api/wishes');
  });
  expect(result, 'the result for a 200 text/html answer').toEqual({ ok: false, error: { reason: 'type', status: 200 } });
});

test('never throws: a network failure and a broken JSON body are results too', async () => {
  let offline;
  await withAnswer({ networkError: true }, async () => { offline = await call('/api/wishes'); });
  expect(offline, 'the result when fetch rejects').toEqual({ ok: false, error: { reason: 'network', status: null } });
  let broken;
  await withAnswer({ status: 200, body: '{"name": ', headers: { 'content-type': 'application/json' } }, async () => { broken = await call('/api/wishes'); });
  expect(broken, 'the result for a JSON body that does not parse').toEqual({ ok: false, error: { reason: 'parse', status: 200 } });
});
