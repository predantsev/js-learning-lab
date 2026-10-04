// The shared list component (read-only): the server renders it, the client hydrates it.
import { createElement as h, useState } from './mini-react.js';

export function WishList({ items }) {
  const [acquired, setAcquired] = useState(() => items.filter((item) => item.acquired).map((item) => item.id));
  function toggle(id) {
    setAcquired(acquired.includes(id) ? acquired.filter((x) => x !== id) : [...acquired, id]);
  }
  return h('ul', null,
    items.map((item) =>
      h('li', { key: item.id },
        item.name, ' ',
        h('button', { type: 'button', 'aria-pressed': acquired.includes(item.id), onClick: () => toggle(item.id) },
          acquired.includes(item.id) ? '%%gotIt%%' : '%%wanted%%'))));
}
