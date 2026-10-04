import { createElement as h } from './mini-react.js';

// Shows names only; `notes` and the config never appear on screen.
export function WishList({ items }) {
  return h('ul', null, items.map((item) => h('li', { key: item.id }, item.name)));
}
