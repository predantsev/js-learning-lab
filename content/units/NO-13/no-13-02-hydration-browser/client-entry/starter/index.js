// Driver (read-only): renders the page as the server did at that moment, then runs your client entry
// against a stand-in page with a hydrateRoot that only reports what it was given.
import { createElement as h, renderToString } from './mini-react.js';
import { WishList } from './WishList.js';
import { fakePage } from './fake-page.js';
import { startClient, matchesServer } from './client.js';

// What the repository held when the server rendered the page.
const data = { items: [{ id: 'w-01', name: '%%headphones%%', acquired: false }, { id: 'w-02', name: '%%lamp%%', acquired: true }] };
const page = fakePage({ markup: renderToString(h(WishList, data)), json: JSON.stringify(data) });

function hydrateRoot(container, element) {
  console.log(`hydrateRoot(#${container?.id}, ${element?.type?.name ?? element?.type}) ${JSON.stringify(element?.props)}`);
  return {};
}

startClient(page, hydrateRoot);
console.log(`matchesServer: ${matchesServer(page)}`);
