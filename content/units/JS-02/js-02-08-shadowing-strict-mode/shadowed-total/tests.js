test('the running total grows every day', () => {
  const expected = [];
  for (let day = 1; day <= 7; day++) expected.push(`${L.day} ${day} ${day * 800}`);
  expect(logs().slice(0, 7), 'the seven daily lines').toEqual(expected);
});

test('the week total is 5600', () => {
  expect(logs()[7], 'the last line').toBe(`${L.week} 5600`);
  expect(scope.total, 'total after the loop').toBe(5600);
});
