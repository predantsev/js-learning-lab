const style = (element) => getComputedStyle(element);
const cards = () => screen.$$('.expense');
const plainCard = () => cards().find((card) => !card.classList.contains('expense-large'));
const largeCard = () => screen.$('.expense-large');
const amountIn = (card) => card.querySelector('.amount');
// Every declaration marked !important in the page's stylesheets.
const importantDeclarations = () => {
  const found = [];
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule.style) for (const property of rule.style) if (rule.style.getPropertyPriority(property) === 'important') found.push(`${rule.selectorText} { ${property} }`);
      if (rule.cssRules) walk(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) walk(sheet.cssRules);
  return found;
};

test('every card has a border and inner spacing', () => {
  for (const card of cards()) {
    const s = style(card);
    expect(s.borderTopStyle !== 'none' && parseFloat(s.borderTopWidth) > 0, 'the card has a visible border').toBe(true);
    expect(parseFloat(s.paddingTop) > 0 && parseFloat(s.paddingLeft) > 0, 'the card has padding on the top and on the left').toBe(true);
  }
});

test('every amount is bold', () => {
  for (const amount of screen.$$('.amount')) expect(Number(style(amount).fontWeight), 'font-weight of an amount').toBeGreaterThanOrEqual(600);
});

test('the large card has an accent border', () => {
  expect(style(largeCard()).borderTopColor === style(plainCard()).borderTopColor, 'the large card has the same border color as a plain card').toBe(false);
});

test('the large amount is red while the other amounts stay dark gray', () => {
  expect(style(amountIn(plainCard())).color, 'color of a plain amount (#333)').toBe('rgb(51, 51, 51)');
  expect(style(amountIn(largeCard())).color === style(amountIn(plainCard())).color, 'the large amount has the same color as a plain one').toBe(false);
});

test('the styles follow the classes, not the position of a card', () => {
  // New cards with the same classes, added at the end, must look exactly like the original ones.
  const make = (large) => {
    const card = document.createElement('article');
    card.className = large ? 'expense expense-large' : 'expense';
    const amount = document.createElement('p');
    amount.className = large ? 'amount amount-large' : 'amount';
    amount.textContent = '1.00';
    card.append(amount);
    plainCard().parentElement.append(card);
    return card;
  };
  const newLarge = make(true);
  const newPlain = make(false);
  try {
    expect(style(newLarge).borderTopColor, 'border color of a new large card').toBe(style(largeCard()).borderTopColor);
    expect(style(amountIn(newLarge)).color, 'amount color of a new large card').toBe(style(amountIn(largeCard())).color);
    expect(style(newPlain).borderTopColor, 'border color of a new plain card').toBe(style(plainCard()).borderTopColor);
  } finally {
    newLarge.remove();
    newPlain.remove();
  }
});

test('no declaration uses !important', () => {
  expect(importantDeclarations(), 'declarations marked !important').toEqual([]);
});
