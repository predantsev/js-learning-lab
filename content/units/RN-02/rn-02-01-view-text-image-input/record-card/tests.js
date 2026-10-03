const cards = () => screen.$$('[data-testid="card"]');
const textOf = (value) => value.args.map((arg) => (typeof arg === 'string' ? arg : String(arg))).join(' ');

test('each card shows the name and the formatted price', async () => {
  await waitFor(() => cards().length === 2);
  const [lamp, tickets] = cards();
  expect(lamp, 'the first card').toHaveTextContent(L.lamp);
  expect(lamp, 'the first card').toHaveTextContent('45 ₴');
  expect(tickets, 'the second card').toHaveTextContent(L.tickets);
  expect(tickets, 'the second card').toHaveTextContent(L.noPrice);
});

test('every piece of text sits inside a Text', async () => {
  await waitFor(() => cards().length === 2);
  const bare = rawLogs().filter((entry) => entry.level === 'error' && /text node cannot be a child of a <View>/.test(textOf(entry)));
  expect(bare.length, 'console errors about text directly inside a View').toBe(0);
});

test('the picture has a width and a height', async () => {
  await waitFor(() => cards().length === 2);
  const picture = cards()[0].querySelector('[data-testid="picture"]');
  expect(picture, 'an element with testID="picture" in the card').toBeTruthy();
  const box = picture.getBoundingClientRect();
  expect(box.width, 'width of the picture').toBeGreaterThan(0);
  expect(box.height, 'height of the picture').toBeGreaterThan(0);
});

test('typing in the field renames the card', async () => {
  await waitFor(() => cards().length === 2);
  const card = cards()[0];
  const field = card.querySelector('input');
  expect(field, 'a TextInput in the card').toBeTruthy();
  await user.clear(field);
  await user.type(field, L.renamed);
  await settle();
  const shown = [...card.querySelectorAll('div, span')].some((el) => el.children.length === 0 && el.textContent.includes(L.renamed));
  expect(shown, `a Text in the card shows "${L.renamed}"`).toBe(true);
});
