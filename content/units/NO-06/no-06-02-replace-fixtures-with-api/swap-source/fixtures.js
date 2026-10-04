// Synthetic expenses bundled with the client. From now on they are for tests and for seeding only.
export function expenseFixtures() {
  return [
    { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
    { id: 'e-02', label: '%%pass%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
    { id: 'e-03', label: '%%coffee%%', amountMinor: 18000, date: '2026-02-28', category: 'fun' },
    { id: 'e-04', label: '%%bulbs%%', amountMinor: 9990, date: '2026-02-27', category: 'home' },
  ];
}
