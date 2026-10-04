// Adds one expense to ledger.db while the server is stopped or running:
//   node add-expense.mjs <id> <amountMinor> <YYYY-MM-DD> <category> <label…>
import { DatabaseSync } from 'node:sqlite';

const [id, amount, date, category, ...label] = process.argv.slice(2);
const db = new DatabaseSync('ledger.db');
db.prepare('INSERT INTO expenses (id, label, amountMinor, date, category) VALUES (?, ?, ?, ?, ?)').run(id, label.join(' '), Number(amount), date, category);
db.close();
console.log(`added ${id}: ${amount} on ${date} (${category})`);
