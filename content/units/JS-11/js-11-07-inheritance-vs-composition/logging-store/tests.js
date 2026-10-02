import { MemoryStore } from './store.js';

const ready = () => expect(typeof scope.withLogging, 'type of withLogging').toBe('function');

test('the program prints the stored value and the two log lines', () => {
  expect(logs(), 'the console of the program').toEqual([L.lamp, 'set w-01 | get w-01']);
});

test('get and set reach the store and return its answers', () => {
  ready();
  const store = new MemoryStore();
  const logged = scope.withLogging(store, () => {});
  logged.set('a', 1);
  expect(store.get('a'), 'the value in the store after logged.set("a", 1)').toBe(1);
  expect(logged.get('a'), 'logged.get("a")').toBe(1);
  expect(logged.get('missing'), 'logged.get("missing")').toBeUndefined();
});

test('every call is logged first and then passed on, in order', () => {
  ready();
  const order = [];
  const store = {
    get(key) {
      order.push('store get ' + key);
      return 5;
    },
    set(key) {
      order.push('store set ' + key);
    },
  };
  const logged = scope.withLogging(store, (message) => order.push('log ' + message));
  logged.set('a', 1);
  logged.get('a');
  expect(order, 'the order of log and store calls').toEqual(['log set a', 'store set a', 'log get a', 'store get a']);
});

test('the store itself is left alone and not inherited from', () => {
  ready();
  const store = new MemoryStore();
  const originalGet = store.get;
  const originalSet = store.set;
  const logged = scope.withLogging(store, () => {});
  expect(logged !== store, 'the wrapper is a new object').toBe(true);
  expect(Object.getPrototypeOf(logged) === store, 'the wrapper inherits from the store').toBe(false);
  expect(store.get === originalGet && store.set === originalSet, 'the methods of the store are the same functions as before').toBe(true);
});
