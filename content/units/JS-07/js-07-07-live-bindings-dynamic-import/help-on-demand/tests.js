const helpArea = () => screen.$('#help');
const helpLines = () => logs().filter((line) => line === '▶ help.js');

test('the page opens without an error', () => {
  expect(loadError(), 'error while the page loaded').toBeNull();
});

test('help.js is not loaded before the first click', () => {
  expect(helpLines(), 'lines printed by help.js before any click').toEqual([]);
});

test('clicking Help shows the help text', async () => {
  await user.click(screen.$('#help-button'));
  await waitFor(() => helpArea().textContent === L.helpText).catch(() => {});
  expect(helpArea(), 'the help area after the click').toHaveTextContent(L.helpText);
});

test('help.js is loaded once, even after another click', async () => {
  await user.click(screen.$('#help-button'));
  await sleep(150);
  expect(helpLines(), 'lines printed by help.js after two clicks').toEqual(['▶ help.js']);
});

test('a wrong path shows the fallback message', async () => {
  expect(typeof scope.showHelp, 'showHelp').toBe('function');
  scope.showHelp('./help-text.js');
  await waitFor(() => helpArea().textContent === L.fallback).catch(() => {});
  expect(helpArea(), 'the help area after loading a wrong path').toHaveTextContent(L.fallback);
});
