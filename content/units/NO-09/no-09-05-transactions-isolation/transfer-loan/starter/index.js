// Three transfers: one that works, one with no open loan to move, one to a member who does not exist.
import { createLibrary } from './library.js';
import { transferLoan } from './app.js';

const db = createLibrary();
const loans = () => db.prepare('SELECT id, memberId, bookId, returnedOn FROM loans ORDER BY id').all()
  .map((l) => `${l.id}:m${l.memberId}/b${l.bookId}${l.returnedOn === null ? ' open' : ''}`).join('  ');

console.log('before:', loans());
const attempts = [
  { fromMember: 1, toMember: 2, bookId: 2, today: '2026-03-12' },
  { fromMember: 3, toMember: 2, bookId: 3, today: '2026-03-12' },
  { fromMember: 2, toMember: 99, bookId: 1, today: '2026-03-12' },
];
for (const transfer of attempts) {
  try {
    transferLoan(db, transfer);
    console.log(`${transfer.fromMember} → ${transfer.toMember}, book ${transfer.bookId}: ok`);
  } catch (error) {
    console.log(`${transfer.fromMember} → ${transfer.toMember}, book ${transfer.bookId}: ${error.message}`);
  }
  console.log('loans: ', loans());
}
db.close();
