import { platformSpec } from './Catalog.jsx';
import { selectFor } from './platformSim.js';

const INSETS = {
  portrait: { top: 59, right: 0, bottom: 34, left: 0 },
  landscape: { top: 0, right: 59, bottom: 21, left: 59 },
};
const frame = (name) => screen.$(`[data-testid="frame-${name}"]`);
const within = (root, selector) => [...root.querySelectorAll(selector)];
const named = (root, role, name) => within(root, '*').find((el) => screen.roleOf(el) === role && screen.nameOf(el) === name) ?? null;
const inputNamed = (root, name) => within(root, 'input').find((el) => el.getAttribute('aria-label') === name) ?? null;
function screenOf(el) {
  const r = el.getBoundingClientRect();
  const left = r.left + el.clientLeft;
  const top = r.top + el.clientTop;
  return { left, top, right: left + el.clientWidth, bottom: top + el.clientHeight };
}
function glyphs(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}
const ready = () => waitFor(() => frame('portrait') && frame('landscape') && within(frame('portrait'), '[data-testid="book"]').length > 0);

test('each book card shows its title, author and a sized cover', async () => {
  await ready();
  const cards = within(frame('portrait'), '[data-testid="book"]');
  expect(cards.length, 'number of book cards').toBe(2);
  expect(cards[0], 'the first card').toHaveTextContent(L.book1);
  expect(cards[0], 'the first card').toHaveTextContent(L.author1);
  const cover = cards[0].querySelector('[data-testid="cover"]');
  expect(cover, 'an element with testID="cover" in the card').toBeTruthy();
  expect(cover.getBoundingClientRect().width, 'width of the cover').toBeGreaterThan(0);
  expect(cover.getBoundingClientRect().height, 'height of the cover').toBeGreaterThan(0);
});

test('each book card is one stop with a sentence for screen readers', async () => {
  await ready();
  for (const card of within(frame('portrait'), '[data-testid="book"]')) {
    const label = card.getAttribute('aria-label') ?? '';
    const title = card.textContent.includes(L.book1) ? L.book1 : L.book2;
    const author = title === L.book1 ? L.author1 : L.author2;
    expect(label, 'the card label').toContain(title);
    expect(label, 'the card label').toContain(author);
  }
});

test('both fields are named by their visible labels', async () => {
  await ready();
  const root = frame('portrait');
  for (const name of [L.titleLabel, L.authorLabel]) {
    expect(inputNamed(root, name), `a field whose accessibility label is "${name}"`).toBeTruthy();
    const visible = within(root, 'div').some((el) => el.children.length === 0 && el.textContent === name);
    expect(visible, `a visible Text "${name}"`).toBe(true);
  }
});

test('saving without a title moves focus to its error', async () => {
  await ready();
  const root = frame('portrait');
  const save = named(root, 'button', L.save);
  expect(save, `a button named "${L.save}"`).toBeTruthy();
  await user.clear(inputNamed(root, L.titleLabel));
  await user.clear(inputNamed(root, L.authorLabel));
  await user.type(inputNamed(root, L.authorLabel), L.newAuthor);
  await user.click(save);
  await waitFor(() => document.activeElement && document.activeElement.textContent === L.titleRequired);
  expect(document.activeElement.textContent, 'text of the focused element after the failed save').toBe(L.titleRequired);
});

test('saving a valid book adds it to the list', async () => {
  await ready();
  const root = frame('portrait');
  const before = within(root, '[data-testid="book"]').length;
  await user.clear(inputNamed(root, L.titleLabel));
  await user.type(inputNamed(root, L.titleLabel), L.newBook);
  await user.clear(inputNamed(root, L.authorLabel));
  await user.type(inputNamed(root, L.authorLabel), L.newAuthor);
  await user.click(named(root, 'button', L.save));
  await waitFor(() => within(root, '[data-testid="book"]').length === before + 1);
  const cards = within(root, '[data-testid="book"]');
  expect(cards[cards.length - 1], 'the new card').toHaveTextContent(L.newBook);
});

test('the heading and the save button stay in the safe area in both orientations', async () => {
  await ready();
  for (const [name, insets] of Object.entries(INSETS)) {
    const root = frame(name);
    const area = screenOf(root);
    const heading = glyphs(root.querySelector('[data-testid="heading"]'));
    expect(heading.top, `${name}: top of the heading text`).toBeGreaterThanOrEqual(area.top + insets.top - 0.5);
    expect(heading.left, `${name}: left edge of the heading text`).toBeGreaterThanOrEqual(area.left + insets.left - 0.5);
    const save = named(root, 'button', L.save);
    let scroller = save.parentElement;
    while (scroller && !(/(auto|scroll)/.test(getComputedStyle(scroller).overflowY))) scroller = scroller.parentElement;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
    await settle();
    const box = save.getBoundingClientRect();
    if (scroller) scroller.scrollTop = 0;
    expect(box.bottom, `${name}: bottom of the save button when scrolled to the end`).toBeLessThanOrEqual(area.bottom - insets.bottom + 0.5);
    expect(box.left, `${name}: left edge of the save button`).toBeGreaterThanOrEqual(area.left + insets.left - 0.5);
    expect(box.right, `${name}: right edge of the save button`).toBeLessThanOrEqual(area.right - insets.right + 0.5);
  }
});

test('nothing is clipped at 200 % text size', async () => {
  await ready();
  const root = frame('portrait');
  for (const input of within(root, 'input')) {
    const style = getComputedStyle(input);
    expect(parseFloat(style.fontSize), 'font size of a field at 200 %').toBeGreaterThanOrEqual(32);
    const needed = parseFloat(style.fontSize) * 1.15 + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    expect(input.clientHeight, 'inner height of a field compared with its text and padding').toBeGreaterThanOrEqual(needed);
  }
  for (const card of within(root, '[data-testid="book"]')) {
    expect(card.scrollHeight, 'content height of a card compared with the card height').toBeLessThanOrEqual(card.clientHeight + 1);
  }
});

test('the save button is at least 44 × 44', async () => {
  await ready();
  const box = named(frame('portrait'), 'button', L.save).getBoundingClientRect();
  expect(box.width, 'width of the save button').toBeGreaterThanOrEqual(44);
  expect(box.height, 'height of the save button').toBeGreaterThanOrEqual(44);
});

test('one platform difference goes through Platform.select', () => {
  const ios = selectFor('ios', platformSpec);
  const android = selectFor('android', platformSpec);
  expect(ios === undefined || android === undefined, 'an iOS or Android value is missing in platformSpec').toBe(false);
  expect(JSON.stringify(ios) === JSON.stringify(android), 'iOS and Android get the same value').toBe(false);
});
