// The client entry. In the browser it runs as: startClient(document, hydrateRoot)
import { createElement as h, renderToString } from './mini-react.js';
import { WishList } from './WishList.js';

// Reads the initial data from the page and hydrates #root with the same component and props.
export function startClient(doc, hydrateRoot) {
}

// True when rendering the element the client hydrates gives exactly the markup inside #root.
export function matchesServer(doc) {
  return false;
}
