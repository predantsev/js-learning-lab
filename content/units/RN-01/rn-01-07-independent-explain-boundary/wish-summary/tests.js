// A phone delivers a tap to a component's onPress and never to onClick, while the browser preview
// fires onClick too. Find the nearest component above the button that received an onPress prop,
// as React recorded it for the latest render, so a check can deliver the tap the way a phone does.
function onPressAbove(element) {
  const fiberKey = Object.keys(element).find((name) => name.startsWith('__reactFiber$'));
  const propsKey = Object.keys(element).find((name) => name.startsWith('__reactProps$'));
  let fiber = fiberKey ? element[fiberKey] : null;
  // The node keeps the fiber it was created with; after an update the current one may be its alternate.
  if (fiber?.alternate && fiber.memoizedProps !== element[propsKey]) fiber = fiber.alternate;
  for (; fiber; fiber = fiber.return) {
    if (typeof fiber.memoizedProps?.onPress === 'function') return fiber.memoizedProps.onPress;
  }
  return undefined;
}

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

test('a tap on a phone reaches the toggle through onPress', async () => {
  await waitFor(() => screen.byRole('heading'));
  const toggle = screen.byRole('button', { name: L.toggle });
  expect(toggle, 'a button named like the toggle label').toBeTruthy();
  const onPress = onPressAbove(toggle);
  expect(typeof onPress, 'type of the onPress above the toggle').toBe('function');
  const wasShown = screen.text().includes(L.w04);
  onPress({ nativeEvent: {} });
  await waitFor(() => screen.text().includes(L.w04) !== wasShown);
  expect(screen.text().includes(L.w06), 'acquired wishes shown after one tap').toBe(!wasShown);
});
