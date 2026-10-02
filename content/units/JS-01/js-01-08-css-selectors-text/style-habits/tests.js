const style = (element) => getComputedStyle(element);
const values = () => screen.$$('main p span');
// Everything that can make a piece of text look different from its neighbors.
const look = (element) => {
  const s = style(element);
  return [s.color, s.fontWeight, s.backgroundColor, s.fontSize, s.fontStyle, s.textDecorationLine].join(' | ');
};

test('the heading is centered', () => {
  expect(style(screen.$('h1')).textAlign, 'text-align of the h1').toBe('center');
});

test('the heading has its own color', () => {
  const heading = style(screen.$('h1')).color;
  const text = style(screen.$('main p')).color;
  expect(heading === text, 'the h1 has the same color as normal text').toBe(false);
});

test('the highlighted value stands out', () => {
  const [marked, plain] = values();
  expect(look(marked) === look(plain), 'the highlighted value looks like the plain one').toBe(false);
});

test('the other value stays plain', () => {
  const [, plain] = values();
  const paragraph = plain.parentElement;
  expect(style(plain).color, 'color of the plain value').toBe(style(paragraph).color);
  expect(style(plain).fontWeight, 'font weight of the plain value').toBe(style(paragraph).fontWeight);
  expect(style(plain).fontSize, 'font size of the plain value').toBe(style(paragraph).fontSize);
  expect(style(plain).backgroundColor, 'background of the plain value').toBe('rgba(0, 0, 0, 0)');
});
