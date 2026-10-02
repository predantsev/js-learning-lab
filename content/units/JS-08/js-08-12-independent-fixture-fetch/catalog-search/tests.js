const statusText = () => screen.$('#status').textContent.trim();
const items = (selector) => screen.$$(`${selector} li`).map((item) => item.textContent.trim());
const BOOKS = () => [
  { id: 'b-01', title: L.book1 },
  { id: 'b-02', title: L.book2 },
  { id: 'b-03', title: L.book3 },
  { id: 'b-04', title: L.book4 },
];

// The catalog server, answered by mockFetch: `searches` maps a query to an answer;
// details answer by id from `detailAnswers` (default: a summary after 40 ms).
function catalog(searches, detailAnswers = {}) {
  const signals = [];
  const mock = mockFetch((url, init = {}) => {
    if (url.pathname.includes('/details/')) {
      const id = url.pathname.split('/').pop().replace('.json', '');
      return detailAnswers[id] ?? { status: 200, body: { id, summary: `summary ${id}` }, delay: 40 };
    }
    signals.push(init.signal ?? null);
    return searches[url.searchParams.get('q')] ?? { status: 200, body: { results: [] } };
  });
  return { mock, signals, restore: mock.restore };
}

const found = (books, delay = 30) => ({ status: 200, body: { results: books }, delay });

function useFakeClock() {
  const realSet = window.setTimeout;
  const realClear = window.clearTimeout;
  const timers = [];
  let now = 0;
  let nextId = 1;
  window.setTimeout = (fn, ms = 0, ...args) => {
    const id = `fake-${nextId++}`;
    timers.push({ id, at: now + Math.max(0, Number(ms) || 0), fn, args });
    return id;
  };
  window.clearTimeout = (id) => {
    const index = timers.findIndex((timer) => timer.id === id);
    if (index !== -1) timers.splice(index, 1);
    else realClear(id);
  };
  return {
    advance(ms) {
      const end = now + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at);
        const next = timers[0];
        if (!next || next.at > end) break;
        timers.shift();
        now = next.at;
        if (typeof next.fn === 'function') next.fn(...next.args);
      }
      now = end;
    },
    restore() {
      window.setTimeout = realSet;
      window.clearTimeout = realClear;
    },
  };
}

function requireSearch() {
  expect(typeof scope.searchBooks, 'type of searchBooks').toBe('function');
}

test('shows the loading text while a search runs', async () => {
  requireSearch();
  const server = catalog({ sad: found(BOOKS(), 100) });
  try {
    screen.$('#status').textContent = '';
    const pending = scope.searchBooks('sad');
    await sleep(10);
    expect(statusText(), 'the status while the search runs').toBe(L.loading);
    await pending;
  } finally {
    server.restore();
  }
});

test('shows the titles of the books found', async () => {
  requireSearch();
  const server = catalog({ sad: found(BOOKS().slice(0, 2)) });
  try {
    await scope.searchBooks('sad');
    expect(items('#books'), 'items of #books').toEqual([L.book1, L.book2]);
  } finally {
    server.restore();
  }
});

test('a newer search aborts the older one and only the newer results stay', async () => {
  requireSearch();
  const server = catalog({ s: found(BOOKS(), 250), sad: found(BOOKS().slice(0, 1), 30) });
  try {
    const first = scope.searchBooks('s');
    await waitFor(() => server.signals.length === 1);
    const second = scope.searchBooks('sad');
    await waitFor(() => server.signals.length === 2);
    expect(server.signals[0]?.aborted, 'the first search request is aborted once the second starts').toBe(true);
    await Promise.all([first, second]);
    await sleep(300);
    expect(items('#books'), 'items of #books after "s" (slow) and "sad" (fast)').toEqual([L.book1]);
  } finally {
    server.restore();
  }
});

test('an aborted search shows no error message', async () => {
  requireSearch();
  const server = catalog({ s: found(BOOKS(), 250), sad: found(BOOKS().slice(0, 1), 150) });
  try {
    const first = scope.searchBooks('s');
    await sleep(10);
    const second = scope.searchBooks('sad');
    await sleep(5);
    expect([L.httpError, L.offline, L.timeout].includes(statusText()), `the status right after the first search was aborted ("${statusText()}") is an error message`).toBe(false);
    await Promise.all([first, second]);
  } finally {
    server.restore();
  }
});

test('shows the server message when the search answers 500', async () => {
  requireSearch();
  const server = catalog({ sad: { status: 500, body: { message: 'broken' }, delay: 20 } });
  try {
    await scope.searchBooks('sad');
    expect(statusText(), 'the status after a 500 answer').toBe(L.httpError);
    expect(items('#books'), 'items of #books after a 500 answer').toEqual([]);
  } finally {
    server.restore();
  }
});

test('shows the offline message without a network', async () => {
  requireSearch();
  const server = catalog({ sad: { networkError: true, delay: 20 } });
  try {
    await scope.searchBooks('sad');
    expect(statusText(), 'the status without a network').toBe(L.offline);
  } finally {
    server.restore();
  }
});

test('shows the timeout message after 3 seconds without an answer', async () => {
  requireSearch();
  const server = catalog({ sad: found(BOOKS(), 60000) });
  const clock = useFakeClock();
  try {
    scope.searchBooks('sad');
    await sleep(20);
    clock.advance(2999);
    await sleep(0);
    expect(statusText(), 'the status after 2999 ms').toBe(L.loading);
    clock.advance(1);
    await sleep(0);
    expect(statusText(), 'the status after 3000 ms').toBe(L.timeout);
  } finally {
    clock.restore();
    server.restore();
  }
});

test('loads the details of the first three books at the same time', async () => {
  requireSearch();
  const server = catalog({ sad: found(BOOKS(), 10) });
  try {
    const pending = scope.searchBooks('sad');
    await waitFor(() => server.mock.calls.some((call) => call.path.includes('/details/')));
    await sleep(15);
    const detailCalls = server.mock.calls.filter((call) => call.path.includes('/details/'));
    expect(detailCalls.length, 'detail requests started before the first detail answer (40 ms)').toBe(3);
    await pending;
  } finally {
    server.restore();
  }
});

test('shows every detail, or that it is unavailable', async () => {
  requireSearch();
  const server = catalog({ sad: found(BOOKS(), 10) }, { 'b-02': { status: 500, body: { message: 'broken' }, delay: 20 } });
  try {
    await scope.searchBooks('sad');
    await sleep(80);
    expect(items('#details'), 'items of #details').toEqual([
      `${L.book1}: summary b-01`,
      `${L.book2}: ${L.unavailable}`,
      `${L.book3}: summary b-03`,
    ]);
  } finally {
    server.restore();
  }
});
