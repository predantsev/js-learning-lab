const ready = () => expect(typeof scope.createListenerTracker, 'type of createListenerTracker').toBe('function');
const tracker = () => {
  ready();
  return scope.createListenerTracker();
};

test('the program prints 0 and 2', () => {
  expect(logs(), 'the console of the program').toEqual(['0', '2']);
});

test('listen really adds the listener', () => {
  const t = tracker();
  const target = new EventTarget();
  let calls = 0;
  t.listen(target, 'ping', () => { calls += 1; });
  target.dispatchEvent(new Event('ping'));
  expect(calls, 'handler calls after one ping').toBe(1);
});

test('remove really removes the listener', () => {
  const t = tracker();
  const target = new EventTarget();
  let calls = 0;
  const remove = t.listen(target, 'ping', () => { calls += 1; });
  remove();
  target.dispatchEvent(new Event('ping'));
  expect(calls, 'handler calls after remove() and one ping').toBe(0);
});

test('countLive follows adds and removes', () => {
  const t = tracker();
  const target = new EventTarget();
  expect(t.countLive(), 'countLive() of a new tracker').toBe(0);
  const removeA = t.listen(target, 'a', () => {});
  t.listen(target, 'b', () => {});
  expect(t.countLive(), 'countLive() after two listen() calls').toBe(2);
  removeA();
  expect(t.countLive(), 'countLive() after one remove()').toBe(1);
});

test('calling remove twice counts once', () => {
  const t = tracker();
  const target = new EventTarget();
  const remove = t.listen(target, 'a', () => {});
  t.listen(target, 'b', () => {});
  remove();
  remove();
  expect(t.countLive(), 'countLive() after removing the same listener twice').toBe(1);
});

test('the same handler for the same target and type counts once', () => {
  const t = tracker();
  const target = new EventTarget();
  let calls = 0;
  const handler = () => { calls += 1; };
  const first = t.listen(target, 'ping', handler);
  const second = t.listen(target, 'ping', handler);
  expect(t.countLive(), 'countLive() after adding one handler twice').toBe(1);
  target.dispatchEvent(new Event('ping'));
  expect(calls, 'handler calls after one ping').toBe(1);
  first();
  second();
  expect(t.countLive(), 'countLive() after both remove() calls').toBe(0);
});

test('two trackers count separately', () => {
  const a = tracker();
  const b = scope.createListenerTracker();
  a.listen(new EventTarget(), 'x', () => {});
  expect(b.countLive(), 'countLive() of the other tracker').toBe(0);
});

test('the tracker shows 0 after 20 clean cycles and 20 after 20 leaky ones', () => {
  const t = tracker();
  const page = new EventTarget();
  for (let i = 0; i < 20; i += 1) {
    const offA = t.listen(page, 'resize', () => {});
    const offB = t.listen(page, 'keydown', () => {});
    offA();
    offB();
  }
  expect(t.countLive(), 'countLive() after 20 clean cycles').toBe(0);
  for (let i = 0; i < 20; i += 1) {
    const offA = t.listen(page, 'resize', () => {});
    t.listen(page, 'keydown', () => {});
    offA();
  }
  expect(t.countLive(), 'countLive() after 20 cycles that forget one listener').toBe(20);
});
