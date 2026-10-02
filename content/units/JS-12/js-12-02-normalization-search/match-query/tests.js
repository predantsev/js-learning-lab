// "й" typed as one code point, and as "и" + a combining breve; "é" likewise.
const tea = 'Чай з лимоном';
const teaPasted = 'Чай з лимоном';
const cafe = 'Café latte';
const cafePasted = 'Café latte';

test('ignores letter case', () => {
  expect(scope.matchesQuery('Настільна Лампа', 'лампа'), 'matchesQuery("Настільна Лампа", "лампа")').toBe(true);
  expect(scope.matchesQuery('Desk lamp', 'LAMP'), 'matchesQuery("Desk lamp", "LAMP")').toBe(true);
});

test('ignores spaces around the query', () => {
  expect(scope.matchesQuery('Настільна лампа', '  лампа '), 'matchesQuery("Настільна лампа", "  лампа ")').toBe(true);
});

test('finds a decomposed letter in the text', () => {
  expect(scope.matchesQuery(teaPasted, 'чай'), 'text with "и" + breve, query "чай"').toBe(true);
  expect(scope.matchesQuery(cafePasted, 'café'), 'text with "e" + accent, query "café"').toBe(true);
});

test('finds text when the query is the decomposed one', () => {
  expect(scope.matchesQuery(tea, 'Чай'), 'query with "и" + breve').toBe(true);
  expect(scope.matchesQuery(cafe, 'café'), 'query with "e" + accent').toBe(true);
});

test('says false when the query is not there', () => {
  expect(scope.matchesQuery('Прогулянка', 'біг'), 'matchesQuery("Прогулянка", "біг")').toBe(false);
  expect(scope.matchesQuery('Go for a walk', 'run'), 'matchesQuery("Go for a walk", "run")').toBe(false);
});
