test('the page has a main area', () => {
  expect(screen.byRole('main'), 'the <main> element').toBeInTheDocument();
});

test('the page title is a first-level heading inside main', () => {
  const heading = screen.$('main h1');
  expect(heading, 'an <h1> inside <main>').toBeInTheDocument();
  expect(heading.textContent.trim().length, 'length of the heading text').toBeGreaterThan(0);
});

test('the page has only one first-level heading', () => {
  expect(screen.$$('h1').length, 'number of <h1> elements on the page').toBe(1);
});

test('main contains two paragraphs with text', () => {
  const paragraphs = screen.$$('main p').filter((paragraph) => paragraph.textContent.trim() !== '');
  expect(paragraphs.length, 'paragraphs with text inside <main>').toBeGreaterThanOrEqual(2);
});
