// The client entry's render: it imports nothing that only the server may have.
import { createElement as h } from './mini-react.js';
import { ReadingList } from './ReadingList.js';

export function clientElement(data) {
  // Readers mostly want what they are reading now.
  return h(ReadingList, { books: data.books, filter: 'reading' });
}
