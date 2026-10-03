// main.tsx: the only place that chooses the adapters.
import { createRoot } from 'react-dom/client';
import { createMoneyFormat, createWebStorage, LoggingMemoryStorage } from './adapters.ts';
import { ExpenseScreen } from './ExpenseScreen.tsx';

const initial = [
  { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: '%%transit%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-04', label: '%%bulbs%%', amountMinor: 9990, date: '2026-02-27', category: 'home' },
];

localStorage.clear(); // start every run from an empty browser storage

const storage = createWebStorage();
// const storage = new LoggingMemoryStorage();
const format = createMoneyFormat('%%locale%%');

createRoot(document.getElementById('root')!).render(
  <ExpenseScreen initial={initial} storage={storage} format={format} />,
);

setTimeout(() => {
  console.log(`localStorage has jsll.expenses.v1: ${localStorage.getItem('jsll.expenses.v1') !== null}`);
}, 300);
