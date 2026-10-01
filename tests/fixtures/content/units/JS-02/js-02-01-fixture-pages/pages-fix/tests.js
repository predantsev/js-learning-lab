test('prints the greeting', () => {
  expect(logs(), 'printed lines').toEqual([L.greeting]);
});
