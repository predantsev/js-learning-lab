const field = () => screen.$('input');
const saveButton = () => screen.byRole('button', { name: L.save });

test('the input carries its visible label as its accessibility label', async () => {
  await waitFor(() => field());
  expect(field().getAttribute('aria-label'), 'the label the preview produced from accessibilityLabel').toBe(L.name);
});

test('the visible label is still shown', async () => {
  await waitFor(() => field());
  const shown = [...document.querySelectorAll('#root div')].some((el) => el.children.length === 0 && el.textContent === L.name);
  expect(shown, `a Text showing "${L.name}"`).toBe(true);
});

test('a failed save moves focus to the error', async () => {
  await waitFor(() => saveButton());
  await user.clear(field());
  await user.click(saveButton());
  await waitFor(() => document.activeElement && document.activeElement.textContent === L.nameRequired);
  expect(document.activeElement.textContent, 'text of the focused element after a failed save').toBe(L.nameRequired);
});

test('a valid save shows no error', async () => {
  await waitFor(() => saveButton());
  await user.clear(field());
  await user.type(field(), L.habit);
  await user.click(saveButton());
  await settle();
  expect(screen.text().includes(L.nameRequired), 'the error text is on the screen').toBe(false);
  expect(logs().some((line) => line.includes(L.habit)), `a console line with "${L.habit}"`).toBe(true);
});
