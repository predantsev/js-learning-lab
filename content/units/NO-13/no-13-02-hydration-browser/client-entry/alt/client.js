// The client entry. In the browser it runs as: startClient(document, hydrateRoot)
import { createElement as h, renderToString } from './mini-react.js';
import { WishList } from './WishList.js';

function clientElement(doc) {
  const { items } = JSON.parse(doc.getElementById('initial-data').textContent);
  return h(WishList, { items });
}

// Reads the initial data from the page and hydrates #root with the same component and props.
export function startClient(doc, hydrateRoot) {
  const root = doc.getElementById('root');
  const app = clientElement(doc);
  hydrateRoot(root, app);
}

// True when rendering the element the client hydrates gives exactly the markup inside #root.
export function matchesServer(doc) {
  const serverMarkup = doc.getElementById('root').innerHTML;
  const clientMarkup = renderToString(clientElement(doc));
  if (serverMarkup !== clientMarkup) return false;
  return true;
}
