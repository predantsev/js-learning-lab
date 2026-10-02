const BASE = 'http://127.0.0.1:4300/data/wishes.json';

// Calls the learner's function and parses its result, so every check reads the query as a server would.
function build(filters) {
  expect(typeof scope.buildFixtureUrl, 'type of buildFixtureUrl').toBe('function');
  const result = scope.buildFixtureUrl(BASE, filters);
  expect(typeof result, 'type of the returned value').toBe('string');
  return new URL(result);
}

test('keeps the base address', () => {
  const url = build({ category: L.homeGarden });
  expect(url.origin + url.pathname, 'the address without the query').toBe(BASE);
});

test('a category with & and spaces arrives as one value', () => {
  const url = build({ category: L.homeGarden });
  expect(url.searchParams.get('category'), 'the category the server reads').toBe(L.homeGarden);
  expect([...url.searchParams.keys()], 'the names of all parameters').toEqual(['category']);
});

test('a search with + and # arrives unchanged', () => {
  const url = build({ category: L.homeGarden, search: L.plusHash });
  expect(url.hash, 'the fragment of the address').toBe('');
  expect(url.searchParams.get('search'), 'the search the server reads').toBe(L.plusHash);
  expect(url.searchParams.get('category'), 'the category the server reads').toBe(L.homeGarden);
});

test('a Cyrillic search term comes back unchanged', () => {
  const url = build({ search: 'Київ' });
  expect(url.searchParams.get('search'), 'the search the server reads').toBe('Київ');
});

test('leaves out empty filters', () => {
  expect([...build({ category: '', search: 'Київ' }).searchParams.keys()], 'parameters for category ""').toEqual(['search']);
  expect([...build({ category: L.homeGarden, search: null }).searchParams.keys()], 'parameters for search null').toEqual(['category']);
  expect(build({}).search, 'the query when no filter is given').toBe('');
});
