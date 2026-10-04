// The wishlist page, split as it would be with React Server Components (read-only).
// kind 'server': renders only on the server; kind 'client': a module marked 'use client'.
const items = [{ id: 'w-01', name: '%%headphones%%', price: 80, acquired: false }];

export const wishTree = {
  name: 'WishPage', kind: 'server', props: {}, children: [
    { name: 'WishSummary', kind: 'server', props: { count: 1, formatPrice: (price) => `${price} UAH` }, children: [] },
    {
      name: 'WishList', kind: 'client', props: { items, onToggle: (id) => id, loadedAt: new Date('2026-03-01T09:00:00Z') }, children: [
        { name: 'WishRow', kind: 'client', props: { item: items[0], onToggle: (id) => id }, children: [] },
      ],
    },
  ],
};
