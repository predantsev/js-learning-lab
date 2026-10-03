import { formatDay } from './format';

const times = () => screen.$$('#root time');
const allFormatted = () => times().length === 2 && times().every((t) => t.textContent === formatDay(t.getAttribute('datetime')));

test('hydration reports no mismatch', async () => {
  await waitFor(allFormatted, { timeout: 1500 }).catch(() => {});
  expect(scope.hydrationErrors, 'the errors React reported during hydration').toEqual([]);
});

test('the <time> elements from the server stay on the page', async () => {
  await waitFor(allFormatted, { timeout: 1500 }).catch(() => {});
  expect(scope.serverTimes.length, 'the number of <time> elements in the server HTML').toBe(2);
  for (const node of scope.serverTimes) {
    expect(node.isConnected, `the server's <time datetime="${node.getAttribute('datetime')}"> is still on the page`).toBe(true);
  }
});

test('after mount every date shows in the reader\'s format', async () => {
  await waitFor(allFormatted, { timeout: 1500 }).catch(() => {});
  expect(times(), 'the <time> elements on the page').toHaveLength(2);
  for (const node of times()) {
    const iso = node.getAttribute('datetime');
    expect(node, `<time datetime="${iso}">`).toHaveTextContent(formatDay(iso));
  }
});
