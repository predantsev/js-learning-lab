import { bundle } from './bundle';

const KEY = 'demo-RATE-not-a-real-key';
const settled = () => waitFor(() => screen.$('#root strong') !== null, { timeout: 1000 }).then(() => sleep(100)).catch(() => {});

test('hydration reports no mismatch', async () => {
  await settled();
  expect(scope.hydrationErrors, 'the errors React reported during hydration').toEqual([]);
});

test('the elements from the server HTML stay on the page', async () => {
  await settled();
  const gone = scope.serverNodes.filter((node) => !node.isConnected).map((node) => `<${node.localName}>`);
  expect(gone, 'server elements that React replaced').toEqual([]);
});

test('after hydration the page shows the total and the euro amount for the server\'s day', async () => {
  await settled();
  expect(screen.$('#root strong'), 'the total').toHaveTextContent(`1365.50 ${L.currency}`);
  expect(screen.$('#root small'), 'the euro amount').toHaveTextContent('≈ € 30.04');
});

test('the client bundle from App.jsx does not contain the rates key', async () => {
  let files = [];
  let error = null;
  try {
    files = await bundle('./App.jsx');
  } catch (caught) {
    error = caught;
  }
  expect(error === null ? 'no build error' : `${error.name}: ${error.message}`, 'the result of bundling App.jsx').toBe('no build error');
  const leaked = files.filter((entry) => entry.text.includes(KEY)).map((entry) => entry.via);
  expect(leaked, 'the client bundle files that contain the key').toEqual([]);
});
