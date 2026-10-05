import { createElement as h, renderToString } from './mini-react.js';
import { WishList } from './WishList.js';
import { fakePage } from './fake-page.js';
import { startClient, matchesServer } from './client.js';

// Fresh data inside the checks; it differs from both the driver and wishes.js.
const pageData = () => ({ items: [{ id: 'w-03', name: L.bicycle, acquired: false }, { id: 'w-06', name: L.mug, acquired: true }] });

function servedPage(data, renderedFrom = data) {
  return fakePage({ markup: renderToString(h(WishList, renderedFrom)), json: JSON.stringify(data) });
}

function hydrateCalls(page) {
  expect(typeof startClient, 'type of startClient').toBe('function');
  const calls = [];
  startClient(page, (container, element) => { calls.push({ container, element }); return {}; });
  return calls;
}

function hydrateOnce(page) {
  const calls = hydrateCalls(page);
  expect(calls.length, 'number of hydrateRoot calls').toBe(1);
  return calls[0];
}

test('hydrates the #root element', () => {
  const page = servedPage(pageData());
  const { container } = hydrateOnce(page);
  expect(container === page.getElementById('root'), `container passed to hydrateRoot is #root (got #${container?.id})`).toBe(true);
});

test('hydrates WishList with exactly the initial data', () => {
  const calls = hydrateCalls(servedPage(pageData()));
  expect(calls.length > 0, 'hydrateRoot was called').toBe(true);
  const { element } = calls[0];
  expect(element?.type, 'component passed to hydrateRoot').toBe(WishList);
  expect(element.props, 'props of the hydrated WishList').toEqual(pageData());
});

test('matchesServer is true when the page was rendered from its data', () => {
  expect(typeof matchesServer, 'type of matchesServer').toBe('function');
  expect(matchesServer(servedPage(pageData())), 'matchesServer for a consistent page').toBe(true);
});

test('matchesServer is false when the markup came from other data', () => {
  expect(typeof matchesServer, 'type of matchesServer').toBe('function');
  const rendered = { items: pageData().items.map((item) => ({ ...item, acquired: !item.acquired })) };
  expect(matchesServer(servedPage(pageData(), rendered)), 'matchesServer when #root was rendered from other data').toBe(false);
});
