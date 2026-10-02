const fn = (name) => expect(typeof scope[name], `type of ${name}`).toBe('function');
const counter = () => ({ released: 0, release() { this.released += 1; } });
const numbers = (count) => Array.from({ length: count }, (_, i) => ({ id: `e-${i + 1}`, label: `L${i + 1}` }));
const utf8 = (text) => new TextEncoder().encode(text);

// Counts the listeners added and still on while `body` runs (signal-based removal included).
async function watchListeners(body) {
  const live = new Set();
  const proto = EventTarget.prototype;
  const add = proto.addEventListener;
  const remove = proto.removeEventListener;
  const find = (target, type, handler) => [...live].find((e) => e.target === target && e.type === type && e.handler === handler);
  proto.addEventListener = function (type, handler, options) {
    add.call(this, type, handler, options);
    if (typeof handler !== 'function' || find(this, type, handler)) return;
    const entry = { target: this, type, handler };
    live.add(entry);
    const signal = options && typeof options === 'object' ? options.signal : undefined;
    if (signal) add.call(signal, 'abort', () => live.delete(entry), { once: true });
  };
  proto.removeEventListener = function (type, handler, options) {
    remove.call(this, type, handler, options);
    const entry = find(this, type, handler);
    if (entry) live.delete(entry);
  };
  try {
    await body(() => live.size);
  } finally {
    proto.addEventListener = add;
    proto.removeEventListener = remove;
  }
}

function newRoot() {
  const root = document.createElement('div');
  document.body.append(root);
  return root;
}
const items = (root) => [...root.querySelectorAll('li')].map((li) => li.textContent);
const press = (key) => document.dispatchEvent(new KeyboardEvent('keydown', { key }));

test('the program prints 2, 1 and the byte length of the first record', () => {
  const first = { id: 'e-01', label: L.groceries };
  expect(logs(), 'the console of the program').toEqual(['2', '1', String(utf8(JSON.stringify([first])).length)]);
});

test('pageThrough yields pages of at most size, without an empty page', () => {
  fn('pageThrough');
  const ids = (pages) => pages.map((page) => page.map((r) => r.id).join(','));
  expect(ids([...scope.pageThrough(numbers(5), 2, counter())]), 'pages of 5 records with size 2').toEqual(['e-1,e-2', 'e-3,e-4', 'e-5']);
  expect(ids([...scope.pageThrough(numbers(4), 2, counter())]), 'pages of 4 records with size 2').toEqual(['e-1,e-2', 'e-3,e-4']);
  expect([...scope.pageThrough([], 2, counter())], 'pages of no records').toEqual([]);
});

test('pageThrough builds a page only when asked', () => {
  fn('pageThrough');
  const records = numbers(3);
  const pages = scope.pageThrough(records, 2, counter());
  pages.next();
  records.push({ id: 'e-4', label: 'L4' });
  expect([...pages].map((page) => page.length), 'sizes of the remaining pages after a record was added').toEqual([2]);
});

test('pageThrough releases the handle once, only when the traversal ends', () => {
  fn('pageThrough');
  const handle = counter();
  const pages = scope.pageThrough(numbers(3), 2, handle);
  pages.next();
  expect(handle.released, 'releases while the traversal is paused').toBe(0);
  pages.next();
  pages.next();
  expect(handle.released, 'releases after the traversal finished').toBe(1);
  pages.next();
  expect(handle.released, 'releases after one more next()').toBe(1);
});

test('pageThrough releases the handle when a loop stops early', () => {
  fn('pageThrough');
  const handle = counter();
  for (const page of scope.pageThrough(numbers(9), 2, handle)) {
    if (page.length > 0) break;
  }
  expect(handle.released, 'releases after break in the first page').toBe(1);
});

test('exportBytes gives UTF-8 bytes of the JSON and their real length', () => {
  fn('exportBytes');
  const records = [{ id: 'e-07', label: 'Обід 🍲' }, { id: 'e-08', label: 'Кава' }];
  const result = scope.exportBytes(records);
  expect(result.bytes, 'bytes').toBeInstanceOf(Uint8Array);
  expect(new TextDecoder().decode(result.bytes), 'the bytes decoded back').toBe(JSON.stringify(records));
  expect(result.byteLength, 'byteLength').toBe(utf8(JSON.stringify(records)).length);
  expect(scope.exportBytes([]).byteLength, 'byteLength of no records').toBe(2);
});

test('mount shows the first page and more on a click or the + key', () => {
  fn('mount');
  const root = newRoot();
  const teardown = scope.mount(root, numbers(5), 2, counter());
  expect(items(root), 'list items after mount').toEqual(['L1', 'L2']);
  const button = root.querySelector('button');
  expect(button, 'the button in root').not.toBeNull();
  expect(button.textContent, 'the button text').toBe(L.more);
  button.click();
  expect(items(root).length, 'list items after a click').toBe(4);
  press('+');
  expect(items(root).length, 'list items after the + key').toBe(5);
  button.click();
  expect(button.disabled, 'button.disabled after the last page').toBe(true);
  teardown();
});

test('teardown leaves zero listeners, an empty root and a released handle', async () => {
  fn('mount');
  await watchListeners((liveCount) => {
    const root = newRoot();
    const handle = counter();
    const teardown = scope.mount(root, numbers(7), 2, handle);
    expect(liveCount() > 0, 'listeners added by mount').toBe(true);
    teardown();
    expect(liveCount(), 'listeners left after teardown').toBe(0);
    expect(root.textContent, 'the content of root after teardown').toBe('');
    expect(handle.released, 'releases after teardown in the middle').toBe(1);
  });
});

test('teardown is safe to call twice and the + key does nothing afterwards', () => {
  fn('mount');
  const root = newRoot();
  const handle = counter();
  const teardown = scope.mount(root, numbers(7), 2, handle);
  teardown();
  expect(() => teardown(), 'the second teardown() call').not.toThrow();
  expect(handle.released, 'releases after two teardown calls').toBe(1);
  press('+');
  expect(root.textContent, 'the content of root after + following teardown').toBe('');
});

test('twenty mount/teardown cycles leave nothing behind', async () => {
  fn('mount');
  await watchListeners((liveCount) => {
    const root = newRoot();
    for (let i = 0; i < 20; i += 1) {
      const teardown = scope.mount(root, numbers(5), 2, counter());
      teardown();
    }
    expect(liveCount(), 'listeners left after 20 cycles').toBe(0);
  });
});

test('a second teardown call does not touch a newer list', () => {
  fn('mount');
  const root = newRoot();
  const first = scope.mount(root, numbers(5), 2, counter());
  first();
  const second = scope.mount(root, numbers(5), 2, counter());
  first();
  expect(items(root), 'list items of the newer list after the old teardown ran again').toEqual(['L1', 'L2']);
  press('+');
  expect(items(root).length, 'list items of the newer list after the + key').toBe(4);
  second();
});
