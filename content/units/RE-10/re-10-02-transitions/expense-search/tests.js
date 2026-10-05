import { expenses } from './expenses';

const field = () => screen.byLabel(L.searchLabel) ?? screen.$('#root input');
const results = () => screen.$(`section[aria-label="${L.results}"]`);
const foundText = () => results()?.querySelector('p')?.textContent ?? '(no results section)';
const foundFor = (query) => `${L.found}: ${expenses.filter((e) => e.label.toLowerCase().includes(query.toLowerCase())).length}`;
// The opacity a person sees: the product of the opacities of the section and its parents.
function seenOpacity(el) {
  let value = 1;
  for (let node = el; node && node !== document.body; node = node.parentElement) value *= Number(getComputedStyle(node).opacity);
  return value;
}
async function settledOn(query) {
  await waitFor(() => foundText() === foundFor(query) && seenOpacity(results()) === 1, { timeout: 3000 });
}

test('every typed character shows in the field at once', async () => {
  const input = field();
  let typed = '';
  for (const ch of L.query) {
    await user.type(input, ch);
    typed += ch;
    expect(input, `the field right after typing "${ch}"`).toHaveValue(typed);
    await sleep(30);
  }
  await settledOn(L.query);
});

test('right after a keystroke the old results stay on screen, dimmed', async () => {
  const input = field();
  await user.clear(input);
  await settledOn('');
  await user.type(input, L.query[0]);
  expect(foundText(), 'the results right after one keystroke').toBe(foundFor(''));
  expect(seenOpacity(results()), 'the opacity of the results while the new list is prepared').toBeLessThan(1);
});

test('when typing stops, the matching results show without dimming', async () => {
  const input = field();
  await user.clear(input);
  for (const ch of L.query) await user.type(input, ch);
  await settledOn(L.query);
  expect(input, 'the field').toHaveValue(L.query);
});
