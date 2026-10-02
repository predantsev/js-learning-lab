function same(a, b) {
  expect(typeof scope.sameOrigin, 'type of sameOrigin').toBe('function');
  return scope.sameOrigin(a, b);
}

test('the same scheme, host and port share an origin, whatever the path', () => {
  expect(same('http://localhost:5173/wishes', 'http://localhost:5173/planner?day=2026-03-02#t-01'), 'two paths on localhost:5173').toBe(true);
});

test('another port, scheme or host is another origin', () => {
  expect(same('http://localhost:5173/', 'http://localhost:5174/'), 'ports 5173 and 5174').toBe(false);
  expect(same('http://localhost:5173/', 'https://localhost:5173/'), 'http and https').toBe(false);
  expect(same('http://localhost:5173/', 'http://app.localhost:5173/'), 'localhost and app.localhost').toBe(false);
  expect(same('http://localhost:5173/', 'http://127.0.0.1:5173/'), 'localhost and 127.0.0.1').toBe(false);
});

test('a default port and letter case do not make a difference', () => {
  expect(same('http://localhost/', 'http://localhost:80/wishes'), 'no port and port 80 with http').toBe(true);
  expect(same('HTTP://LocalHost:5173/a', 'http://localhost:5173/b'), 'capital letters in the scheme and host').toBe(true);
});

test('an invalid address or a null origin never matches', () => {
  expect(same('not an address', 'not an address'), 'two texts that are not URLs').toBe(false);
  expect(same('data:text/plain,lamp', 'data:text/plain,lamp'), 'two identical data: addresses').toBe(false);
});

test('storageFacts describes local and session storage', () => {
  const facts = scope.storageFacts;
  expect(facts?.localStorage, 'storageFacts.localStorage').toEqual({ scope: 'origin', sentWithRequests: false, readableByScripts: true });
  expect(facts?.sessionStorage, 'storageFacts.sessionStorage').toEqual({ scope: 'origin and tab', sentWithRequests: false, readableByScripts: true });
});

test('storageFacts describes both kinds of cookies', () => {
  const facts = scope.storageFacts;
  expect(facts?.cookie, 'storageFacts.cookie').toEqual({ scope: 'host and path', sentWithRequests: true, readableByScripts: true });
  expect(facts?.httpOnlyCookie, 'storageFacts.httpOnlyCookie').toEqual({ scope: 'host and path', sentWithRequests: true, readableByScripts: false });
});
