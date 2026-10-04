// Synthetic stored books (read-only). ownerNote is private.
export const books = [
  { id: 'b-01', title: '%%book1%%', author: '%%author1%%', status: 'reading', ownerNote: '%%note%%' },
  { id: 'b-02', title: '%%book2%%', author: '%%author2%%', status: 'done', ownerNote: '' },
  { id: 'b-03', title: '</script><script>alert(1)</script>', author: '%%author3%%', status: 'reading', ownerNote: '' },
];
