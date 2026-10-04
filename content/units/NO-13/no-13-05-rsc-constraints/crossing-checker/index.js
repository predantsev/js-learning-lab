// Props that a server-rendered expense page would pass to its one client component, ExpenseFilter.
import { canCross } from './crossing.js';

class Money {
  constructor(minor) { this.minor = minor; }
  format() { return (this.minor / 100).toFixed(2); }
}

const props = {
  expenses: [{ id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' }],
  generatedAt: new Date('2026-03-01T09:00:00Z'),
  totals: new Map([['food', 84550]]),
  onFilter: (category) => console.log(category),
  budget: new Money(150000),
};

for (const [name, value] of Object.entries(props)) {
  console.log(`${name.padEnd(12)} ${canCross(value) ? '%%crosses%%' : '%%blocked%%'}`);
}
