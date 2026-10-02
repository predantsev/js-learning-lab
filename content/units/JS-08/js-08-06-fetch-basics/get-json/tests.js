// Calls getJson and reports how its promise settled: { value } or { error }.
async function outcome(url) {
  expect(typeof scope.getJson, 'type of getJson').toBe('function');
  try {
    return { value: await scope.getJson(url) };
  } catch (error) {
    return { error };
  }
}

// Runs `fn` with fetch answering from `routes` instead of the project files.
async function withServer(routes, fn) {
  const server = mockFetch(routes);
  try {
    return await fn(server);
  } finally {
    server.restore();
  }
}

test('returns the parsed records of a JSON file', async () => {
  const result = await outcome('./data/expenses.json');
  expect(result.error?.message, 'the error of getJson("./data/expenses.json")').toBeUndefined();
  expect(Array.isArray(result.value), 'the result is an array').toBe(true);
  expect(result.value.map((expense) => expense.id), 'ids of the records').toEqual(['e-01', 'e-02']);
  expect(result.value[0].label, 'label of the first record').toBe(L.groceries);
});

test('rejects with status 404 for a missing file', async () => {
  const result = await outcome('./data/missing.json');
  expect(result.error instanceof Error, 'getJson("./data/missing.json") is rejected with an Error').toBe(true);
  expect(result.error.status, 'the status property of that Error').toBe(404);
});

test('rejects with status 500 for a server error', async () => {
  await withServer({ '/api/expenses': { status: 500, body: { message: 'broken' } } }, async () => {
    const result = await outcome('/api/expenses');
    expect(result.error instanceof Error, 'getJson("/api/expenses") is rejected with an Error').toBe(true);
    expect(result.error.status, 'the status property of that Error').toBe(500);
  });
});

test('accepts any ok status, such as 201', async () => {
  await withServer({ '/api/created': { status: 201, body: { id: 'e-07' } } }, async () => {
    const result = await outcome('/api/created');
    expect(result.error?.message, 'the error of getJson for a 201 response').toBeUndefined();
    expect(result.value, 'the parsed body of the 201 response').toEqual({ id: 'e-07' });
  });
});

test('rejects a response whose Content-Type is not JSON', async () => {
  // The body happens to be valid JSON text, but the server says it is an HTML page.
  await withServer({ '/api/page': { status: 200, body: '[1, 2]', headers: { 'content-type': 'text/html' } } }, async () => {
    const result = await outcome('/api/page');
    expect(result.error instanceof Error, 'getJson for a text/html response is rejected with an Error').toBe(true);
  });
});

test('rejects a text file', async () => {
  const result = await outcome('./data/readme.txt');
  expect(result.error instanceof Error, 'getJson("./data/readme.txt") is rejected with an Error').toBe(true);
});
