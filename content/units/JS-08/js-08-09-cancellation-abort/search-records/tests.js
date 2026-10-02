const statusText = () => screen.$('#status').textContent.trim();
const titles = () => screen.$$('#results li').map((item) => item.textContent.trim());

// The lab search, answered by mockFetch. Each query has its own delay and results;
// the signal of every request is kept so a check can see whether it was aborted.
function searchServer(answers) {
  const signals = [];
  const mock = mockFetch((url, init = {}) => {
    signals.push(init.signal ?? null);
    return answers[url.searchParams.get('q')] ?? { status: 200, body: { results: [] } };
  });
  return { signals, restore: mock.restore };
}

const answer = (titlesList, delay) => ({ status: 200, body: { results: titlesList.map((title, i) => ({ id: `t-${i}`, title })) }, delay });

function requireSearch() {
  expect(typeof scope.searchRecords, 'type of searchRecords').toBe('function');
}

test('shows the results of one search', async () => {
  requireSearch();
  const server = searchServer({ wa: answer([L.water], 20) });
  try {
    await scope.searchRecords('wa');
    expect(titles(), 'titles after searching "wa"').toEqual([L.water]);
  } finally {
    server.restore();
  }
});

test('a new search aborts the previous request', async () => {
  requireSearch();
  const server = searchServer({ w: answer([L.water, L.write], 200), wa: answer([L.water], 30) });
  try {
    const first = scope.searchRecords('w');
    await waitFor(() => server.signals.length === 1);
    const second = scope.searchRecords('wa');
    await waitFor(() => server.signals.length === 2);
    expect(server.signals[0] !== null, 'the first request was given a signal').toBe(true);
    expect(server.signals[0].aborted, 'the first request is aborted once the second search starts').toBe(true);
    await Promise.all([first, second]);
  } finally {
    server.restore();
  }
});

test('only the latest results stay on the page', async () => {
  requireSearch();
  const server = searchServer({ w: answer([L.water, L.write], 200), wa: answer([L.water], 30) });
  try {
    const first = scope.searchRecords('w');
    await sleep(10);
    const second = scope.searchRecords('wa');
    await Promise.all([first, second]);
    await sleep(250);
    expect(titles(), 'titles after "w" (slow) and then "wa" (fast)').toEqual([L.water]);
  } finally {
    server.restore();
  }
});

test('an aborted search shows no error message', async () => {
  requireSearch();
  const server = searchServer({ w: answer([L.water, L.write], 200), wa: answer([L.water], 150) });
  try {
    screen.$('#status').textContent = '';
    const first = scope.searchRecords('w');
    await sleep(10);
    const second = scope.searchRecords('wa');
    await sleep(5);
    expect(statusText(), 'the status right after the first search was aborted').not.toBe(L.error);
    await Promise.all([first, second]);
    expect(statusText(), 'the status after both searches ended').not.toBe(L.error);
  } finally {
    server.restore();
  }
});

test('a real failure still shows the error message', async () => {
  requireSearch();
  const server = searchServer({ x: { status: 500, body: { message: 'broken' }, delay: 20 } });
  try {
    await scope.searchRecords('x');
    expect(statusText(), 'the status after a 500 answer').toBe(L.error);
  } finally {
    server.restore();
  }
});
