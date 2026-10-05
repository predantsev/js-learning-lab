// The shared reading-list component (read-only): filter buttons and the books that match.
import { createElement as h, useState } from './mini-react.js';

const FILTERS = [['all', '%%all%%'], ['reading', '%%reading%%'], ['done', '%%done%%']];

export function ReadingList({ books, filter }) {
  const [current, setCurrent] = useState(filter);
  const shown = current === 'all' ? books : books.filter((book) => book.status === current);
  return h('section', null,
    h('div', { role: 'group', 'aria-label': '%%filterLabel%%' },
      FILTERS.map(([value, label]) =>
        h('button', { key: value, type: 'button', 'aria-pressed': current === value, onClick: () => setCurrent(value) }, label))),
    h('ul', null, shown.map((book) => h('li', { key: book.id }, book.title.trim(), ' — ', book.author))));
}
