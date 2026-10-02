const frame = () => screen.$('.frame');
const form = () => screen.$('.add-wish');
const list = () => screen.$('.wishes');
const formItems = () => [...form().children];
// Lay the frame out at a given width, measure, then restore the learner's own CSS.
const atWidth = (width, measure) => {
  frame().style.width = `${width}px`;
  try {
    return measure();
  } finally {
    frame().style.width = '';
  }
};
// Elements stand on one line when each of them starts above the bottom edge of the first one.
const onOneLine = (elements) => {
  const first = elements[0].getBoundingClientRect();
  return elements.every((element) => element.getBoundingClientRect().top < first.bottom - 1);
};
const columnCount = () => getComputedStyle(list()).gridTemplateColumns.split(' ').filter(Boolean).length;
const px = (value) => parseFloat(value) || 0;

test('the form is a flex row that keeps its items on one line when there is room', () => {
  expect(['flex', 'inline-flex'].includes(getComputedStyle(form()).display), 'the form .add-wish is a flex container').toBe(true);
  expect(atWidth(900, () => onOneLine(formItems())), 'all three fields and the button on one line in a 900px frame').toBe(true);
});

test('the form wraps instead of overflowing in a narrow frame', () => {
  const result = atWidth(260, () => ({ overflow: form().scrollWidth > form().clientWidth + 1, oneLine: onOneLine(formItems()) }));
  expect(result.overflow, 'the form sticks out of a 260px frame').toBe(false);
  expect(result.oneLine, 'everything still squeezed into one line of a 260px frame').toBe(false);
});

test('the wish list is a grid with several columns when there is room', () => {
  expect(getComputedStyle(list()).display, 'display of the list .wishes').toBe('grid');
  expect(atWidth(900, columnCount), 'number of grid columns in a 900px frame').toBeGreaterThanOrEqual(3);
});

test('the grid falls back to one column in a narrow frame', () => {
  const result = atWidth(260, () => ({ columns: columnCount(), overflow: list().scrollWidth > list().clientWidth + 1 }));
  expect(result.columns, 'number of grid columns in a 260px frame').toBe(1);
  expect(result.overflow, 'the cards stick out of a 260px frame').toBe(false);
});

test('form items and cards are separated by gaps', () => {
  const formStyle = getComputedStyle(form());
  const listStyle = getComputedStyle(list());
  expect(px(formStyle.columnGap), 'column-gap of the form in px').toBeGreaterThanOrEqual(4);
  expect(px(listStyle.columnGap), 'column-gap of the card grid in px').toBeGreaterThanOrEqual(4);
  expect(px(listStyle.rowGap), 'row-gap of the card grid in px').toBeGreaterThanOrEqual(4);
});
