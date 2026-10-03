const textNodeErrors = () =>
  rawLogs().filter((entry) => entry.level === 'error' && JSON.stringify(entry.args).includes('text node'));

test('every element of the summary is drawn by a React Native component', async () => {
  await waitFor(() => screen.byRole('heading'));
  const webOnly = screen
    .$$('#root *')
    .filter((element) => !/\bcss-(view|text)/.test(element.className))
    .map((element) => `<${element.tagName.toLowerCase()}>`);
  expect(webOnly, 'elements not produced by View, Text or Pressable').toEqual([]);
});

test('no text sits outside a Text component', async () => {
  await waitFor(() => screen.byRole('heading'));
  expect(textNodeErrors().length, 'console errors about a text node outside Text').toBe(0);
});

test('the summary shows the total of wanted wishes with a price', async () => {
  await waitFor(() => screen.byRole('heading'));
  expect(screen.text(), 'the summary').toContain(`${L.total}: 365`);
});

test('pressing the toggle also shows the acquired wishes', async () => {
  await waitFor(() => screen.byRole('heading'));
  expect(screen.text(), 'the list before the press').not.toContain(L.w04);
  const toggle = screen.byRole('button', { name: L.toggle });
  expect(toggle, 'a button named like the toggle label').toBeTruthy();
  await user.click(toggle);
  await waitFor(() => screen.text().includes(L.w04));
  expect(screen.text(), 'the list after the press').toContain(L.w06);
});
