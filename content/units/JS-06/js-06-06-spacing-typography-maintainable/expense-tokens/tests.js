const root = document.documentElement;
const style = (selector) => getComputedStyle(screen.$(selector));
const TOKENS = ['--space-1', '--space-2', '--space-3', '--text-sm', '--text-base', '--text-lg', '--text-xl', '--color-accent', '--color-muted'];
// Give one token another value on <html> for the duration of a measurement.
const withToken = (name, value, measure) => {
  root.style.setProperty(name, value);
  try {
    return measure();
  } finally {
    root.style.removeProperty(name);
  }
};

test('all nine tokens are defined on :root', () => {
  const missing = TOKENS.filter((name) => getComputedStyle(root).getPropertyValue(name).trim() === '');
  expect(missing, 'tokens without a value on :root').toEqual([]);
});

test('every spacing comes from a space token', () => {
  const places = {
    '--space-1': [['.expense h2', 'marginBottom'], ['.meta', 'marginTop']],
    '--space-2': [['header', 'paddingTop'], ['.summary', 'marginBottom'], ['.list', 'rowGap'], ['.expense', 'paddingTop']],
    '--space-3': [['header', 'paddingLeft'], ['main', 'paddingTop']],
  };
  for (const [token, list] of Object.entries(places)) {
    const values = withToken(token, '41px', () => list.map(([selector, property]) => style(selector)[property]));
    list.forEach(([selector, property], i) => expect(values[i], `${property} of ${selector} once ${token} is 41px`).toBe('41px'));
  }
});

test('accent and muted colors come from the color tokens', () => {
  const accent = withToken('--color-accent', 'rgb(1, 2, 3)', () => [style('header').backgroundColor, style('.summary').color, style('.amount').color]);
  expect(accent, 'header background, summary color and amount color once --color-accent is rgb(1, 2, 3)').toEqual(['rgb(1, 2, 3)', 'rgb(1, 2, 3)', 'rgb(1, 2, 3)']);
  const muted = withToken('--color-muted', 'rgb(4, 5, 6)', () => [style('.meta').color, style('.note').color]);
  expect(muted, 'colors of .meta and .note once --color-muted is rgb(4, 5, 6)').toEqual(['rgb(4, 5, 6)', 'rgb(4, 5, 6)']);
});

test('font sizes come from the text tokens', () => {
  const places = {
    '--text-sm': ['.meta', '.note'],
    '--text-base': ['body', '.expense h2'],
    '--text-lg': ['.summary', '.amount'],
    '--text-xl': ['h1'],
  };
  for (const [token, selectors] of Object.entries(places)) {
    const sizes = withToken(token, '37px', () => selectors.map((selector) => style(selector).fontSize));
    selectors.forEach((selector, i) => expect(sizes[i], `font-size of ${selector} once ${token} is 37px`).toBe('37px'));
  }
});

test('the type scale follows the root font size', () => {
  const selectors = ['h1', '.amount', '.meta'];
  const before = selectors.map((selector) => parseFloat(style(selector).fontSize));
  const base = parseFloat(getComputedStyle(root).fontSize);
  root.style.fontSize = `${base * 1.25}px`;
  let after;
  try {
    after = selectors.map((selector) => parseFloat(style(selector).fontSize));
  } finally {
    root.style.fontSize = '';
  }
  selectors.forEach((selector, i) => expect(after[i] / before[i], `how much ${selector} grows when the root font size grows 1.25 times`).toBeCloseTo(1.25, 2));
});
