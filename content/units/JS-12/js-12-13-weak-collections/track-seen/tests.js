test('a card is not seen until it is marked', () => {
  const card = { id: 'w-02' };
  expect(scope.wasSeen(card), 'wasSeen before markSeen').toBe(false);
  scope.markSeen(card);
  expect(scope.wasSeen(card), 'wasSeen after markSeen').toBe(true);
});

test('marking one card does not mark another', () => {
  const lamp = { id: 'w-02' };
  const bike = { id: 'w-03' };
  scope.markSeen(lamp);
  expect(scope.wasSeen(bike), 'wasSeen(another card)').toBe(false);
});

test('a separate object with the same contents is not seen', () => {
  const card = { id: 'w-04' };
  scope.markSeen(card);
  expect(scope.wasSeen({ id: 'w-04' }), 'wasSeen(a copy with the same id)').toBe(false);
});

test('only objects can be marked: text is refused with a TypeError', () => {
  expect(typeof scope.markSeen, 'type of markSeen').toBe('function');
  expect(() => scope.markSeen('w-05'), 'markSeen("w-05")').toThrow(TypeError);
});
