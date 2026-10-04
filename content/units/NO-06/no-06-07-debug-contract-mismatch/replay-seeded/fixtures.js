// Synthetic wishes for tests and seeding (read-only). Not what the server holds today.
export function wishFixtures() {
  return [
    { id: 'w-01', name: '%%headphones%%', price: 80, acquired: false },
    { id: 'w-02', name: '%%lamp%%', price: 45, acquired: false },
    { id: 'w-03', name: '%%bicycle%%', price: 240, acquired: false },
  ];
}
