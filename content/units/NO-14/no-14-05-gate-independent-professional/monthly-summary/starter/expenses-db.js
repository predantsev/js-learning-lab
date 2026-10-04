// The expense ledger's schema and synthetic fixtures (read-only).
// freshLedger(name): writes a new SQLite file <name>.db in the working folder → the file name.
// Amounts are whole minor units (cents); dates are 'YYYY-MM-DD' text.
import { rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export const SCHEMA = `
  CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    amountMinor INTEGER NOT NULL CHECK (amountMinor > 0),
    date TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('food', 'transport', 'home', 'fun'))
  );
  CREATE INDEX expenses_by_date ON expenses (date);
`;

export const EXPENSES = [
  { id: 'e-01', label: `%%groceries%%`, amountMinor: 4250, date: '2026-02-28', category: 'food' },
  { id: 'e-02', label: `%%transit%%`, amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-03', label: `%%bakery%%`, amountMinor: 1890, date: '2026-03-04', category: 'food' },
  { id: 'e-04', label: `%%bulbs%%`, amountMinor: 9990, date: '2026-03-12', category: 'home' },
  { id: 'e-05', label: `%%cinema%%`, amountMinor: 2600, date: '2026-03-20', category: 'fun' },
  { id: 'e-06', label: `%%market%%`, amountMinor: 3310, date: '2026-03-31', category: 'food' },
  { id: 'e-07', label: `%%taxi%%`, amountMinor: 7400, date: '2026-04-01', category: 'transport' },
];

export function freshLedger(name, expenses = EXPENSES) {
  const file = `${name}.db`;
  rmSync(file, { force: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  const insert = db.prepare('INSERT INTO expenses (id, label, amountMinor, date, category) VALUES (?, ?, ?, ?, ?)');
  for (const e of expenses) insert.run(e.id, e.label, e.amountMinor, e.date, e.category);
  db.close();
  return file;
}
