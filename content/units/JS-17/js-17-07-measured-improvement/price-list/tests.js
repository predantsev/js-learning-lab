import * as render from './render.js';
import * as written from './report.js';
import { CATEGORIES, WISH_COUNT, makeWishes } from './data.js';

const renderWishes = () => {
  expect(typeof render.renderWishes, 'type of the renderWishes export of render.js').toBe('function');
  return render.renderWishes;
};
// The text every row showed before any change, computed the slow, obviously correct way.
const expectedText = (wish) => {
  const category = CATEGORIES.find((c) => c.id === wish.category)?.name ?? '—';
  const price = wish.price === null ? L.noPrice : wish.price.toLocaleString(L.locale, { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 });
  return `${wish.name} · ${category} · ${price}`;
};
const renderedInto = (wishes) => {
  const container = document.createElement('ul');
  renderWishes()(container, wishes);
  return container;
};

test('every row shows the same text as before the change', () => {
  const wishes = makeWishes(300);
  const rows = [...renderedInto(wishes).querySelectorAll('li')];
  expect(rows.length, 'rows for 300 wishes').toBe(300);
  const texts = rows.map((row) => row.querySelector('span')?.textContent ?? '');
  const changed = texts.findIndex((text, i) => text !== expectedText(wishes[i]));
  expect(changed === -1 ? 'all the same' : `row ${changed + 1}: "${texts[changed]}" instead of "${expectedText(wishes[changed])}"`, 'the text of the rows').toBe('all the same');
});

test('prices are formatted with only a few formatter preparations', () => {
  const run = renderWishes();
  const wishes = makeWishes(2000);
  const originalToLocale = Number.prototype.toLocaleString;
  const OriginalFormat = Intl.NumberFormat;
  let preparations = 0;
  Number.prototype.toLocaleString = function (...args) {
    preparations += 1;
    return originalToLocale.apply(this, args);
  };
  Intl.NumberFormat = function (...args) {
    preparations += 1;
    return new OriginalFormat(...args);
  };
  try {
    run(document.createElement('ul'), wishes);
  } finally {
    Number.prototype.toLocaleString = originalToLocale;
    Intl.NumberFormat = OriginalFormat;
  }
  expect(preparations, 'toLocaleString calls and new Intl.NumberFormat while rendering 2,000 wishes').toBeLessThanOrEqual(300);
});

test('every toggle button keeps its data-id and aria-pressed', () => {
  const wishes = makeWishes(8);
  const buttons = [...renderedInto(wishes).querySelectorAll('button')];
  expect(buttons.length, 'toggle buttons for 8 wishes').toBe(8);
  expect(buttons.map((button) => button.dataset.id), 'the data-id of every button').toEqual(wishes.map((wish) => wish.id));
  expect(buttons.map((button) => button.getAttribute('aria-pressed')), 'the aria-pressed of every button').toEqual(wishes.map((wish) => String(wish.acquired)));
});

test('after a toggle the focus stays on the same wish', async () => {
  const button = screen.$('#wishes button[data-id="w-3"]');
  expect(button, 'the toggle button of w-3 on the page').toBeTruthy();
  const before = button.getAttribute('aria-pressed');
  await user.click(button);
  const focused = document.activeElement;
  expect(focused?.dataset?.id, 'data-id of the focused element after the toggle').toBe('w-3');
  expect(focused.getAttribute('aria-pressed'), 'aria-pressed of w-3 after the toggle').toBe(before === 'true' ? 'false' : 'true');
});

const report = () => {
  expect(typeof written.report, 'type of the report export of report.js').toBe('object');
  return written.report;
};
const positive = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

test('the report gives both medians at the dataset size of the page', () => {
  expect(report().datasetSize, 'datasetSize').toBe(WISH_COUNT);
  expect(positive(report().baselineMs) && positive(report().afterMs), 'baselineMs and afterMs are positive numbers').toBe(true);
  expect(report().afterMs < report().baselineMs, 'afterMs is smaller than baselineMs').toBe(true);
});

test('the report names the hypothesis and the one change', () => {
  for (const field of ['hypothesis', 'change']) {
    expect(typeof report()[field] === 'string' && report()[field].trim().length > 0, `${field} is text that is not empty`).toBe(true);
  }
});

test('the report confirms the tests and the keyboard check', () => {
  expect(report().testsPassed, 'testsPassed').toBe(true);
  expect(report().focusKept, 'focusKept').toBe(true);
});
