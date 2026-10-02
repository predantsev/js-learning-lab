const lamp = { name: 'Lamp', acquired: false };

test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('makeLabeler returns a function', () => {
  expect(typeof scope.makeLabeler('A: '), 'type of makeLabeler("A: ")').toBe('function');
});

test('the returned function adds the prefix to the name', () => {
  expect(scope.makeLabeler('A: ')(lamp), 'makeLabeler("A: ")(record)').toBe('A: Lamp');
});

// Fails only when making a second labeler changes what the first one returns (shared state);
// the label text itself is checked by the test above.
test('each labeler keeps its own prefix', () => {
  const first = scope.makeLabeler('1: ');
  const before = first(lamp);
  scope.makeLabeler('2: ')(lamp);
  expect(first(lamp), 'the first labeler after a second one was made').toBe(before);
});

test('wantLabel and haveLabel use their prefixes', () => {
  expect(scope.wantLabel(lamp), 'wantLabel(record)').toBe(L.wantPrefix + 'Lamp');
  expect(scope.haveLabel(lamp), 'haveLabel(record)').toBe(L.havePrefix + 'Lamp');
});

test('prints both labels', () => {
  expect(logs()).toEqual([L.wantPrefix + L.headphones, L.havePrefix + L.mug]);
});
