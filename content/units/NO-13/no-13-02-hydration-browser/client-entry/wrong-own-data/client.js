// The client entry. In the browser it runs as: startClient(document, hydrateRoot)
import { createElement as h, renderToString } from './mini-react.js';
import { WishList } from './WishList.js';
import { wishes } from './wishes.js';

function readInitialData(doc) {
  return JSON.parse(doc.getElementById('initial-data').textContent);
}

// Reads the initial data from the page and hydrates #root with the same component and props.
export function startClient(doc, hydrateRoot) {
  const data = readInitialData(doc);
  // Fresher than the page: the repository may have changed since the server rendered it.
  return hydrateRoot(doc.getElementById('root'), h(WishList, { items: wishes }));
}

// True when rendering the element the client hydrates gives exactly the markup inside #root.
export function matchesServer(doc) {
  const data = readInitialData(doc);
  return renderToString(h(WishList, data)) === doc.getElementById('root').innerHTML;
}
