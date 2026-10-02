const column = () => screen.$('.column');
const card = () => screen.$('.card');
// Lay the column out at a given width, measure, then restore the learner's own CSS.
const withColumnWidth = (width, measure) => {
  column().style.width = `${width}px`;
  try {
    return measure();
  } finally {
    column().style.width = '';
  }
};

test('the card fits inside a narrow column', () => {
  for (const width of [260, 220]) {
    const fits = withColumnWidth(width, () => {
      const box = column();
      const innerRight = box.getBoundingClientRect().left + box.clientLeft + box.clientWidth;
      return card().getBoundingClientRect().right <= innerRight + 0.5;
    });
    expect(fits, `the card’s right edge stays inside a ${width}px column`).toBe(true);
  }
});

test('the card never grows wider than 360px', () => {
  const width = withColumnWidth(800, () => card().getBoundingClientRect().width);
  expect(Math.round(width), 'width of the card on screen in an 800px column').toBeLessThanOrEqual(360);
});

test('the text keeps comfortable spacing from the border', () => {
  const s = getComputedStyle(card());
  for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
    expect(parseFloat(s[`padding${side}`]), `padding-${side.toLowerCase()} of the card in px`).toBeGreaterThanOrEqual(12);
  }
});

test('padding and border count inside the width', () => {
  expect(getComputedStyle(card()).boxSizing, 'box-sizing of the card').toBe('border-box');
});
