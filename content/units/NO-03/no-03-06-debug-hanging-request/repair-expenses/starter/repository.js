// Read-only stand-in for the expense storage. It "loads" right after it is created: `loaded`
// becomes true and the 'loaded' event fires once — before any request can arrive.
import { EventEmitter } from 'node:events';

export function createRepository() {
  const repository = new EventEmitter();
  repository.loaded = false;
  repository.expenses = [
    { id: 'e-01', label: '%%expense1%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
    { id: 'e-02', label: '%%expense2%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
    { id: 'e-03', label: '%%expense3%%', amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  ];
  queueMicrotask(() => {
    repository.loaded = true;
    repository.emit('loaded');
  });
  return repository;
}
