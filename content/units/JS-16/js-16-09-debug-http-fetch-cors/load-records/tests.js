// Calls loadRecords while fetch answers from `answers` in turn (the last one repeats).
async function load(answers) {
  expect(typeof scope.loadRecords, 'type of loadRecords').toBe('function');
  let call = 0;
  const server = mockFetch(() => answers[Math.min(call++, answers.length - 1)]);
  try {
    await scope.loadRecords('/api/expenses');
  } finally {
    server.restore();
  }
  return {
    requests: server.calls.length,
    message: screen.$('#status').textContent,
    shown: screen.$$('#records li').map((item) => item.textContent),
  };
}

const json = (status, body) => ({ status, body, headers: { 'content-type': 'application/json; charset=utf-8' } });
const html = (status) => ({ status, body: '<!doctype html><title>Error</title><h1>Error</h1>', headers: { 'content-type': 'text/html; charset=utf-8' } });
const records = [{ id: 'e-03', label: L.coffee }, { id: 'e-04', label: L.bulbs }];

test('shows the records of a JSON answer', async () => {
  const result = await load([json(200, records)]);
  expect(result.shown, 'the records on the page').toEqual([L.coffee, L.bulbs]);
  expect(result.message, 'the message').toBe('');
});

test('shows the status of an HTTP error and does not retry it', async () => {
  const missing = await load([json(404, { error: 'not found' })]);
  expect(missing.requests, 'requests for a 404').toBe(1);
  expect(missing.message, 'the message for a 404').toBe(`${L.httpError} (404)`);
  expect(missing.shown, 'the records on the page after a 404').toEqual([]);
  const broken = await load([html(500)]);
  expect(broken.requests, 'requests for a 500 with an HTML body').toBe(1);
  expect(broken.message, 'the message for a 500 with an HTML body').toBe(`${L.httpError} (500)`);
});

test('does not parse a 200 page that is not JSON', async () => {
  const result = await load([html(200)]);
  expect(result.requests, 'requests for a 200 HTML page').toBe(1);
  expect(result.message, 'the message for a 200 HTML page').toBe(L.notJson);
  expect(result.shown, 'the records on the page').toEqual([]);
});

test('retries a rejected fetch exactly once', async () => {
  const result = await load([{ networkError: true }]);
  expect(result.requests, 'requests when fetch keeps rejecting').toBe(2);
  expect(result.shown, 'the records on the page').toEqual([]);
});

test('after the retry the message does not claim the server is down', async () => {
  const result = await load([{ networkError: true }]);
  expect(result.message, 'the message when fetch keeps rejecting').toBe(L.noAnswer);
});

test('a load that works on the second attempt shows the records', async () => {
  const result = await load([{ networkError: true }, json(200, records)]);
  expect(result.requests, 'requests').toBe(2);
  expect(result.shown, 'the records on the page').toEqual([L.coffee, L.bulbs]);
  expect(result.message, 'the message').toBe('');
});
