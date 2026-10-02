const label = (name, priceText) => name + ' — ' + priceText;

test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('the page shows the lamp label', () => {
  expect(screen.$('#label')?.textContent, 'text of the paragraph #label').toBe(label(L.lamp, '45 ' + L.uah));
});

test('formatLabel returns the label with the price', () => {
  expect(scope.formatLabel({ name: 'Mug', price: 18 }), 'formatLabel({ name: "Mug", price: 18 })').toBe(label('Mug', '18 ' + L.uah));
});

test('formatLabel handles a missing price and a zero price', () => {
  expect(scope.formatLabel({ name: 'Tickets', price: null }), 'formatLabel with price null').toBe(label('Tickets', L.noPrice));
  expect(scope.formatLabel({ name: 'Gift', price: 0 }), 'formatLabel with price 0').toBe(label('Gift', '0 ' + L.uah));
});

test('formatLabel does not touch the page', () => {
  const paragraph = screen.$('#label');
  const before = paragraph.textContent;
  paragraph.textContent = 'untouched';
  scope.formatLabel({ name: 'Mug', price: 18 });
  const after = paragraph.textContent;
  paragraph.textContent = before;
  expect(after, 'the paragraph #label after calling formatLabel').toBe('untouched');
});

test('formatLabel does not print anything', () => {
  const before = logs().length;
  scope.formatLabel({ name: 'Mug', price: 18 });
  expect(logs().length - before, 'lines printed by formatLabel').toBe(0);
});

test('formatLabel does not change the item', () => {
  const item = { name: 'Mug', price: 18 };
  scope.formatLabel(item);
  expect(item, 'the item after formatLabel(item)').toEqual({ name: 'Mug', price: 18 });
});
