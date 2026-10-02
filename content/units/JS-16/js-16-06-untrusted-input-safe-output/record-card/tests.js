const HTML_SINKS = /innerHTML|outerHTML|insertAdjacentHTML|document\.write/;

function card(expense) {
  expect(typeof scope.renderRecordCard, 'type of renderRecordCard').toBe('function');
  const element = scope.renderRecordCard(expense);
  expect(element instanceof HTMLElement, 'renderRecordCard returns an element').toBe(true);
  return element;
}

const plain = { id: 'e-02', label: L.transit, amountMinor: 52000, date: '2026-03-01', category: 'transport' };
const tricky = { id: 'e-09', label: L.markupLabel, amountMinor: 1250, date: '2026-03-02', category: 'fun' };

test('an ordinary expense still renders its heading, amount and category', () => {
  const element = card(plain);
  expect(element.querySelector('h3')?.textContent, 'the heading').toBe(L.transit);
  expect(element.querySelector('.amount')?.textContent, 'the amount').toBe('520.00 UAH');
  expect(element.querySelector('.category')?.textContent, 'the category').toBe(L.transport);
  expect(element.querySelector('h3')?.getAttribute('title'), 'the heading tooltip').toBe(L.transit);
});

test('a label with markup stays text in the heading', () => {
  const heading = card(tricky).querySelector('h3');
  expect(heading?.textContent, 'the heading text').toBe(L.markupLabel);
  expect(heading?.children.length, 'elements inside the heading').toBe(0);
});

test('the tooltip holds the whole label, quotes included', () => {
  const element = card(tricky);
  expect(element.querySelector('h3')?.getAttribute('title'), 'the heading tooltip').toBe(L.markupLabel);
  expect(element.querySelector('h3')?.getAttributeNames(), 'attributes of the heading').toEqual(['title']);
  expect(element.querySelectorAll('b, i, u, img').length, 'elements made from the label').toBe(0);
});

test('the search term is shown as text', () => {
  expect(typeof scope.showSearch, 'type of showSearch').toBe('function');
  scope.showSearch(L.markupLabel);
  const line = screen.$('#search');
  expect(line.textContent, 'the search line').toBe(`${L.resultsFor} ${L.markupLabel}`);
  expect(line.children.length, 'elements inside the search line').toBe(0);
});

test('the page shows every fetched label as text', () => {
  const headings = screen.$$('#expenses h3');
  expect(headings.map((h) => h.textContent), 'headings on the page').toEqual([L.groceries, L.coffee, L.pageMarkup]);
  expect(screen.$$('#expenses h3 *').length, 'elements inside the headings').toBe(0);
});

test('OUTPUTS names the source, the context and a safe API of each value', () => {
  const outputs = scope.OUTPUTS;
  expect(Array.isArray(outputs) && outputs.length, 'number of rows in OUTPUTS').toBe(3);
  expect(outputs.map((row) => row.source), 'the sources').toEqual(['fetched JSON', 'fetched JSON', 'URL query']);
  expect(outputs.map((row) => row.context), 'the output contexts').toEqual(['text', 'attribute', 'text']);
  for (const row of outputs) {
    expect(typeof row.api === 'string' && row.api.trim().length > 0, `an API is named for ${row.value}`).toBe(true);
    expect(HTML_SINKS.test(row.api), `the API for ${row.value} is not an HTML sink`).toBe(false);
  }
});
