const texts = (selector) => screen.$$(`${selector} li`).map((item) => item.textContent.trim());
const items = (n) => Array.from({ length: n }, (_, i) => ({ id: `x-${i}` }));

// The three lab collections, answered by mockFetch. `answers` maps a path part to a response.
function server(answers) {
  return mockFetch((url) => {
    const key = Object.keys(answers).find((part) => url.pathname.includes(part));
    return answers[key];
  });
}

const ALL_OK = {
  wishlist: { status: 200, body: { items: items(3) }, delay: 80 },
  planner: { status: 200, body: { items: items(4) }, delay: 40 },
  habits: { status: 200, body: { items: items(2) }, delay: 120 },
};

async function run(answers) {
  expect(typeof scope.loadDashboard, 'type of loadDashboard').toBe('function');
  const mock = server(answers);
  try {
    await scope.loadDashboard();
    return mock;
  } finally {
    mock.restore();
  }
}

test('starts all three requests before any of them answers', async () => {
  expect(typeof scope.loadDashboard, 'type of loadDashboard').toBe('function');
  const mock = server(ALL_OK);
  try {
    const pending = scope.loadDashboard();
    await waitFor(() => mock.calls.length > 0);
    await sleep(15);
    expect(mock.calls.length, 'requests started before the fastest answer (40 ms)').toBe(3);
    await pending;
  } finally {
    mock.restore();
  }
});

test('shows the count of every source when nothing fails', async () => {
  await run(ALL_OK);
  expect(texts('#counts'), 'items of #counts').toEqual([`${L.wishes}: 3`, `${L.tasks}: 4`, `${L.habits}: 2`]);
  expect(texts('#failed'), 'items of #failed').toEqual([]);
});

test('shows the others and lists the source that answered 500', async () => {
  await run({ ...ALL_OK, planner: { status: 500, body: { message: 'broken' }, delay: 40 } });
  expect(texts('#counts'), 'items of #counts').toEqual([`${L.wishes}: 3`, `${L.habits}: 2`]);
  expect(texts('#failed'), 'items of #failed').toEqual([L.tasks]);
});

test('shows the others and lists the source that had no network', async () => {
  await run({ ...ALL_OK, habits: { networkError: true, delay: 20 } });
  expect(texts('#counts'), 'items of #counts').toEqual([`${L.wishes}: 3`, `${L.tasks}: 4`]);
  expect(texts('#failed'), 'items of #failed').toEqual([L.habits]);
});
