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

test('each labeler keeps its own prefix', () => {
  const first = scope.makeLabeler('1: ');
  const second = scope.makeLabeler('2: ');
  expect(first(lamp), 'the first labeler after the second was made').toBe('1: Lamp');
  expect(second(lamp), 'the second labeler').toBe('2: Lamp');
});

test('wantLabel and haveLabel use their prefixes', () => {
  expect(scope.wantLabel(lamp), 'wantLabel(record)').toBe(L.wantPrefix + 'Lamp');
  expect(scope.haveLabel(lamp), 'haveLabel(record)').toBe(L.havePrefix + 'Lamp');
});

test('prints both labels', () => {
  expect(logs()).toEqual([L.wantPrefix + L.headphones, L.havePrefix + L.mug]);
});
