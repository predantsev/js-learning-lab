const textOf = (node) => node.textContent.replace(/\s+/g, ' ').trim();
const focusables = () => screen.$$('a[href], button, input, select, textarea');
// Everything that can mark the focused element: an outline, a shadow ring, a background or border change.
const ringOf = (element) => {
  const s = getComputedStyle(element);
  const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 ? `${s.outlineStyle} ${s.outlineWidth}` : 'none';
  return { outline, shadow: s.boxShadow, background: s.backgroundColor, border: `${s.borderTopStyle} ${s.borderTopWidth} ${s.borderTopColor}` };
};

test('the page has a header landmark', () => {
  const header = screen.$$('header').find((element) => !element.parentElement.closest('main, article, section, aside, nav'));
  expect(header, 'a <header> for the whole page (not inside main, section, article, aside or nav)').toBeDefined();
  const brand = [...header.querySelectorAll('a[href]')].some((link) => textOf(link) === L.appName);
  expect(brand, `the link “${L.appName}” inside the header`).toBe(true);
});

test('the section links are inside a nav landmark', () => {
  const nav = screen.$('nav');
  expect(nav, 'a <nav> element').toBeInTheDocument();
  const links = [...nav.querySelectorAll('a[href]')].map(textOf);
  expect(links, 'links inside <nav>').toContain(L.today);
  expect(links, 'links inside <nav>').toContain(L.stats);
});

test('the main content is inside a main landmark', () => {
  const main = screen.$('main');
  expect(main, 'a <main> element').toBeInTheDocument();
  expect(main.contains(screen.$('button')), 'the button is inside <main>').toBe(true);
  expect(main.contains(document.getElementById('stats')), 'the statistics section is inside <main>').toBe(true);
});

test('the page has exactly one first-level heading', () => {
  const headings = screen.$$('h1');
  expect(headings.length, 'number of <h1> elements').toBe(1);
  expect(textOf(headings[0]), 'text of the <h1>').toBe(L.title);
});

test('no element jumps the tab order with a positive tabindex', () => {
  const jumpers = screen.$$('body *').filter((element) => element.tabIndex > 0).map((element) => element.tagName.toLowerCase());
  expect(jumpers, 'elements with tabindex greater than 0').toEqual([]);
});

test('focus is clearly visible on every link and button', () => {
  for (const element of focusables()) {
    document.activeElement?.blur?.();
    const before = ringOf(element);
    element.focus();
    const after = ringOf(element);
    element.blur();
    const marked = after.outline !== 'none' || (after.shadow !== 'none' && after.shadow !== before.shadow) || after.background !== before.background || after.border !== before.border;
    expect(marked, `a visible focus indicator on ${element.tagName.toLowerCase()} “${textOf(element)}”`).toBe(true);
  }
});
