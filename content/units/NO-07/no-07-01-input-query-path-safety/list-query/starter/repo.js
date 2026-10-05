// The wishlist repository (read-only). It trusts its arguments and counts how often it is called.
const items = [
  { id: 'w-01', name: '%%headphones%%', price: 80, category: '%%tech%%' },
  { id: 'w-02', name: '%%lamp%%', price: 45, category: '%%home%%' },
  { id: 'w-03', name: '%%bicycle%%', price: 240, category: '%%sport%%' },
  { id: 'w-06', name: '%%mug%%', price: 18, category: '%%home%%' },
];

export function createItemRepo() {
  const repo = {
    calls: 0,
    list({ limit, offset, sort }) {
      repo.calls += 1;
      const sorted = items.toSorted((a, b) => (a[sort] < b[sort] ? -1 : a[sort] > b[sort] ? 1 : 0));
      return sorted.slice(offset, offset + limit);
    },
  };
  return repo;
}
