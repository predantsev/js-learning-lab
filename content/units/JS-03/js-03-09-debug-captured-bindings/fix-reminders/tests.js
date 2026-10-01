test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('every reminder names its own task', () => {
  expect(logs().slice(0, 3), 'the three reminders').toEqual([L.reminder + L.task1, L.reminder + L.task2, L.reminder + L.task3]);
});

test('the card shows the current title of the task', () => {
  expect(logs()[3], 'the card line').toBe(L.cardPrefix + L.tidyMore);
});

test('makeCardTitle reads the title when it is called', () => {
  const record = { title: 'A' };
  const cardTitle = scope.makeCardTitle(record);
  record.title = 'B';
  expect(cardTitle(), 'the card title after the record was renamed').toBe(L.cardPrefix + 'B');
});

test('prints exactly four lines', () => {
  expect(logs(), 'printed lines').toHaveLength(4);
});
