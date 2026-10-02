// A fake storage kept in memory. load() gives a fresh copy, save() replaces everything.
const memoryStorage = (initial = {}) => ({
  data: { ...initial },
  load() {
    return { ...this.data };
  },
  save(data) {
    this.data = { ...data };
  },
});

// The same cases run against both designs.
const designs = () => {
  expect(typeof scope.KeyValueStore, 'type of KeyValueStore').toBe('function');
  expect(typeof scope.createKeyValueStore, 'type of createKeyValueStore').toBe('function');
  return {
    class: () => new scope.KeyValueStore(),
    factory: () => scope.createKeyValueStore(memoryStorage()),
  };
};

// The descriptor of `size`, wherever in the prototype chain it lives.
const sizeDescriptor = (store) => {
  let holder = store;
  while (holder !== null && !Object.hasOwn(holder, 'size')) {
    holder = Object.getPrototypeOf(holder);
  }
  return holder === null ? undefined : Object.getOwnPropertyDescriptor(holder, 'size');
};

test('the program prints 3, the new name and 1', () => {
  expect(logs(), 'the console of the program').toEqual(['3', L.lamp, '1']);
});

test('both designs store, read and overwrite entries', () => {
  for (const [name, make] of Object.entries(designs())) {
    const store = make();
    store.set('w-01', L.headphones);
    expect(store.get('w-01'), `${name}: get after set`).toBe(L.headphones);
    store.set('w-01', L.lamp);
    expect(store.get('w-01'), `${name}: get after overwriting the same key`).toBe(L.lamp);
    store.set('w-02', null);
    expect(store.get('w-02'), `${name}: a stored null`).toBeNull();
  }
});

test('both designs answer undefined for a missing key, even for inherited names', () => {
  for (const [name, make] of Object.entries(designs())) {
    const store = make();
    expect(store.get('w-09'), `${name}: get of a key that was never set`).toBeUndefined();
    expect(store.get('toString'), `${name}: get("toString") on an empty store`).toBeUndefined();
    expect(store.get('constructor'), `${name}: get("constructor") on an empty store`).toBeUndefined();
  }
});

test('both designs delete an entry and say whether it existed', () => {
  for (const [name, make] of Object.entries(designs())) {
    const store = make();
    store.set('w-01', L.headphones);
    expect(store.delete('w-01'), `${name}: delete of an existing key`).toBe(true);
    expect(store.get('w-01'), `${name}: get after delete`).toBeUndefined();
    expect(store.delete('w-01'), `${name}: delete of the same key again`).toBe(false);
    expect(store.delete('toString'), `${name}: delete("toString") when it was never set`).toBe(false);
  }
});

test('both designs count their entries in size', () => {
  for (const [name, make] of Object.entries(designs())) {
    const store = make();
    expect(store.size, `${name}: size of an empty store`).toBe(0);
    store.set('w-01', L.headphones);
    store.set('w-02', L.lamp);
    store.set('w-01', L.bicycle);
    expect(store.size, `${name}: size after three sets of two keys`).toBe(2);
    store.delete('w-02');
    expect(store.size, `${name}: size after a delete`).toBe(1);
  }
});

test('size is a read-only getter in both designs', () => {
  for (const [name, make] of Object.entries(designs())) {
    const store = make();
    const descriptor = sizeDescriptor(store);
    expect(descriptor, `${name}: the descriptor of size`).toBeDefined();
    expect(typeof descriptor.get, `${name}: the getter of size`).toBe('function');
    expect(descriptor.set, `${name}: the setter of size`).toBeUndefined();
    expect(() => {
      store.size = 99;
    }, `${name}: assigning to size`).toThrow(TypeError);
  }
});

test('class: the entries are private', () => {
  expect(typeof scope.KeyValueStore, 'type of KeyValueStore').toBe('function');
  const store = new scope.KeyValueStore();
  store.set('w-01', L.headphones);
  expect(Object.getOwnPropertyNames(store), 'the own property names of a store').toEqual([]);
  expect(JSON.stringify(store), 'JSON.stringify of a store').toBe('{}');
});

test('class: fromEntries is a static factory that builds a store', () => {
  expect(typeof scope.KeyValueStore, 'type of KeyValueStore').toBe('function');
  expect(typeof scope.KeyValueStore.fromEntries, 'type of KeyValueStore.fromEntries').toBe('function');
  const store = scope.KeyValueStore.fromEntries([['w-01', L.headphones], ['w-02', L.lamp], ['w-01', L.bicycle]]);
  expect(store, 'the result of fromEntries').toBeInstanceOf(scope.KeyValueStore);
  expect(store.size, 'size after three entries with two different keys').toBe(2);
  expect(store.get('w-01'), 'the later entry for a repeated key').toBe(L.bicycle);
  expect(store.fromEntries, 'fromEntries on an instance').toBeUndefined();
  expect(scope.KeyValueStore.fromEntries([]).size, 'size of a store built from no entries').toBe(0);
});

test('class: fromEntries rejects malformed input with a TypeError', () => {
  expect(typeof scope.KeyValueStore.fromEntries, 'type of KeyValueStore.fromEntries').toBe('function');
  const bad = [
    ['not an array', 'text instead of an array'],
    [undefined, 'undefined instead of an array'],
    [[['w-01']], 'a pair with one item'],
    [[['w-01', 1, 2]], 'a pair with three items'],
    [[[7, L.lamp]], 'a pair with a key that is not text'],
    [[null], 'an entry that is not an array'],
  ];
  for (const [input, what] of bad) {
    expect(() => scope.KeyValueStore.fromEntries(input), what).toThrow(TypeError);
  }
});

test('factory: it reads from and writes through the storage it holds', () => {
  expect(typeof scope.createKeyValueStore, 'type of createKeyValueStore').toBe('function');
  const storage = memoryStorage({ 'w-01': L.headphones });
  const store = scope.createKeyValueStore(storage);
  expect(store.get('w-01'), 'get of an entry that was already in the storage').toBe(L.headphones);
  expect(store.size, 'size with one entry already in the storage').toBe(1);
  store.set('w-02', L.lamp);
  expect(storage.data, 'the storage after set').toEqual({ 'w-01': L.headphones, 'w-02': L.lamp });
  store.delete('w-01');
  expect(storage.data, 'the storage after delete').toEqual({ 'w-02': L.lamp });
});

test('factory: it keeps no copy of its own, so two stores over one storage agree', () => {
  expect(typeof scope.createKeyValueStore, 'type of createKeyValueStore').toBe('function');
  const storage = memoryStorage();
  const first = scope.createKeyValueStore(storage);
  const second = scope.createKeyValueStore(storage);
  first.set('w-01', L.headphones);
  expect(second.get('w-01'), 'the second store reads what the first one wrote').toBe(L.headphones);
  second.delete('w-01');
  expect(first.size, 'the first store after the second deleted the entry').toBe(0);
});

test('factory: stores over different storages stay independent', () => {
  expect(typeof scope.createKeyValueStore, 'type of createKeyValueStore').toBe('function');
  const storageA = memoryStorage();
  const storageB = memoryStorage();
  const a = scope.createKeyValueStore(storageA);
  const b = scope.createKeyValueStore(storageB);
  a.set('w-01', L.headphones);
  expect(b.size, 'the size of a store over another storage').toBe(0);
  expect(storageB.data, 'the other storage').toEqual({});
});
