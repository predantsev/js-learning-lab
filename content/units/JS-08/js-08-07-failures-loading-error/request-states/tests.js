const statusText = () => screen.$('#status').textContent.trim();
const listNames = () => screen.$$('#list li').map((item) => item.textContent.trim());
const WISHES = () => [
  { id: 'w-01', name: L.headphones },
  { id: 'w-02', name: L.lamp },
];

// fetch answers by the query of the lab address: ?status=500, ?delay=10000 (never in time) or plain.
function labServer() {
  return mockFetch((url) => {
    if (url.search.includes('status=500')) return { status: 500, body: { status: 500, ok: false } };
    if (url.search.includes('delay=10000')) return { status: 200, body: { items: WISHES(), total: 2 }, delay: 60000 };
    return { status: 200, body: { items: WISHES(), total: 2 }, delay: 30 };
  });
}

// A fake clock for setTimeout/clearTimeout, so the 3-second timeout passes without waiting.
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

function requireFunction(name) {
  expect(typeof scope[name], `type of ${name}`).toBe('function');
}

test('renderRequestState shows the loading text and an empty list', () => {
  requireFunction('renderRequestState');
  scope.renderRequestState({ status: 'success', items: WISHES() });
  scope.renderRequestState({ status: 'loading' });
  expect(statusText(), 'the status text in the loading state').toBe(L.loading);
  expect(listNames(), 'list items in the loading state').toEqual([]);
});

test('renderRequestState shows every wish on success', () => {
  requireFunction('renderRequestState');
  scope.renderRequestState({ status: 'success', items: WISHES() });
  expect(listNames(), 'list items in the success state').toEqual([L.headphones, L.lamp]);
  expect(statusText(), 'the status text in the success state').not.toBe(L.loading);
});

test('renderRequestState shows three different error messages', () => {
  requireFunction('renderRequestState');
  scope.renderRequestState({ status: 'error', kind: 'http', httpStatus: 503 });
  const http = statusText();
  scope.renderRequestState({ status: 'error', kind: 'network' });
  const network = statusText();
  scope.renderRequestState({ status: 'error', kind: 'timeout' });
  const timeout = statusText();
  expect(http, 'the HTTP error text').toContain(L.httpError);
  expect(http, 'the HTTP error text').toContain('503');
  expect(network, 'the network error text').toContain(L.networkError);
  expect(timeout, 'the timeout text').toContain(L.timeoutError);
  expect(listNames(), 'list items in an error state').toEqual([]);
});

test('load shows the loading state while it waits', async () => {
  requireFunction('load');
  const server = labServer();
  try {
    screen.$('#status').textContent = '…';
    const pending = scope.load('ok');
    await sleep(0);
    expect(statusText(), 'the status text right after load("ok") started').toBe(L.loading);
    await pending;
  } finally {
    server.restore();
  }
});

test('load shows the wishes when the server answers', async () => {
  requireFunction('load');
  const server = labServer();
  try {
    await scope.load('ok');
    expect(listNames(), 'list items after load("ok")').toEqual([L.headphones, L.lamp]);
  } finally {
    server.restore();
  }
});

test('load shows the HTTP message with the status for a 500', async () => {
  requireFunction('load');
  const server = labServer();
  try {
    await scope.load('error500');
    expect(statusText(), 'the status text after load("error500")').toContain(L.httpError);
    expect(statusText(), 'the status text after load("error500")').toContain('500');
  } finally {
    server.restore();
  }
});

test('load shows the network message when offline', async () => {
  requireFunction('load');
  const server = labServer();
  try {
    await scope.load('offline');
    expect(statusText(), 'the status text after load("offline")').toContain(L.networkError);
  } finally {
    server.restore();
  }
});

test('load shows the timeout message after 3 seconds without an answer', async () => {
  requireFunction('load');
  const server = labServer();
  const clock = useFakeClock();
  try {
    scope.load('hung');
    await sleep(20);
    clock.advance(2999);
    await sleep(0);
    expect(statusText(), 'the status text after 2999 ms').toBe(L.loading);
    clock.advance(1);
    await sleep(0);
    expect(statusText(), 'the status text after 3000 ms').toContain(L.timeoutError);
  } finally {
    clock.restore();
    server.restore();
  }
});
