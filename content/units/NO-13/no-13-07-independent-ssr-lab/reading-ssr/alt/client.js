// The client entry's render: it imports nothing that only the server may have.
import { createElement as h } from './mini-react.js';
import { ReadingList } from './ReadingList.js';

export function clientElement({ books, filter }) {
  return h(ReadingList, { books, filter });
}
