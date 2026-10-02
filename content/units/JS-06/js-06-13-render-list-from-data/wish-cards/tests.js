const cards = () => screen.$$('#wishes li');
const priceText = (wish) => (wish.price === null ? L.noPrice : `${wish.price} ${L.currency}`);
// A project SVG set from JavaScript is shown through a data: URL with the file's content.
const showsFile = (img, path) => {
  const src = img.getAttribute('src');
  return src === path || src === `data:image/svg+xml;charset=utf-8,${encodeURIComponent(files[path])}`;
};

test('on load every wish becomes one card with its name and price', () => {
  const list = cards();
  expect(list, 'the cards (li) in #wishes').toHaveLength(scope.wishes.length);
  scope.wishes.forEach((wish, i) => {
    expect(list[i].querySelector('h3'), `the h3 heading of card ${i + 1}`).toHaveTextContent(wish.name);
    expect(list[i], `card ${i + 1}`).toHaveTextContent(priceText(wish));
  });
});

test('a wish without a price says so instead of null', () => {
  scope.render(scope.wishes);
  const card = cards()[1];
  expect(card, 'the card of the wish without a price').toHaveTextContent(L.noPrice);
  expect(card.textContent, 'the text of the card without a price').not.toContain('null');
});

test('every image shows its wish file and has alt text with the wish name', () => {
  scope.render(scope.wishes);
  scope.wishes.forEach((wish, i) => {
    const img = cards()[i].querySelector('img');
    expect(img, `the img in card ${i + 1}`).toBeTruthy();
    expect(showsFile(img, wish.image), `the img in card ${i + 1} shows ${wish.image}`).toBe(true);
    expect(img.getAttribute('alt') ?? '', `the alt text of the img in card ${i + 1}`).toContain(wish.name);
  });
});

test('every card has Edit and Delete buttons named after its wish', () => {
  scope.render(scope.wishes);
  scope.wishes.forEach((wish, i) => {
    const names = [...cards()[i].querySelectorAll('button')].map((button) => screen.nameOf(button));
    expect(names.some((name) => name.includes(L.edit) && name.includes(wish.name)), `an Edit button named after “${wish.name}” (names found: ${names.join(' | ')})`).toBe(true);
    expect(names.some((name) => name.includes(L.delete) && name.includes(wish.name)), `a Delete button named after “${wish.name}” (names found: ${names.join(' | ')})`).toBe(true);
  });
});

test('every button has type button', () => {
  scope.render(scope.wishes);
  const buttons = screen.$$('#wishes button');
  expect(buttons, 'the buttons in #wishes').toHaveLength(scope.wishes.length * 2);
  for (const button of buttons) expect(button.getAttribute('type'), `the type attribute of “${button.textContent}”`).toBe('button');
});

test('a name with markup is shown as text', () => {
  const name = '<em>Lamp</em>';
  scope.render([{ id: 'w-09', name, price: 10, image: 'img/globe.svg' }]);
  expect(cards(), 'the cards after render with one wish').toHaveLength(1);
  expect(cards()[0].querySelector('h3'), 'the h3 heading of the card').toHaveTextContent(name);
  expect(screen.$('#wishes em'), 'an <em> element made from the name').toBeNull();
});

test('an empty list shows the message and the cards come back afterwards', () => {
  scope.render([]);
  expect(cards(), 'the cards after render([])').toHaveLength(0);
  expect(screen.$('#wishes'), '#wishes after render([])').toHaveTextContent(L.empty);
  scope.render(scope.wishes);
  expect(cards(), 'the cards after render(wishes)').toHaveLength(scope.wishes.length);
  expect(screen.$('#wishes').textContent, 'the text of #wishes after render(wishes)').not.toContain(L.empty);
});

test('render replaces the old cards instead of adding to them', () => {
  scope.render(scope.wishes);
  scope.render(scope.wishes);
  expect(cards(), 'the cards after two calls of render(wishes)').toHaveLength(scope.wishes.length);
  scope.render(scope.wishes.slice(0, 1));
  expect(cards(), 'the cards after render with one wish').toHaveLength(1);
});
