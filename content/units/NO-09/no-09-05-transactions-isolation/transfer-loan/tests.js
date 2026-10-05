// Each check uses a fresh library: loan 2 is member 1's open loan of book 2; member 3 returned book 3.
import { createLibrary } from './library.js';
import { transferLoan } from './app.js';

const snapshot = (db) => JSON.stringify(db.prepare('SELECT * FROM loans ORDER BY id').all());

function attempt(transfer) {
  expect(typeof transferLoan, 'type of transferLoan').toBe('function');
  const db = createLibrary();
  const before = snapshot(db);
  let error = null;
  try {
    transferLoan(db, transfer);
  } catch (caught) {
    error = caught;
  }
  return { db, before, error };
}

test('moves an open loan to the other member', () => {
  const { db, error } = attempt({ fromMember: 1, toMember: 2, bookId: 2, today: '2026-03-12' });
  if (error) throw error;
  expect(db.prepare('SELECT returnedOn FROM loans WHERE id = 2').get().returnedOn, 'returnedOn of loan 2').toBe('2026-03-12');
  const opened = db.prepare('SELECT memberId, loanedOn FROM loans WHERE bookId = 2 AND returnedOn IS NULL').all().map((l) => ({ ...l }));
  expect(opened, 'open loans of book 2 afterwards').toEqual([{ memberId: 2, loanedOn: '2026-03-12' }]);
});

test('with no open loan of that book it throws and changes nothing', () => {
  const { db, before, error } = attempt({ fromMember: 3, toMember: 2, bookId: 3, today: '2026-03-12' });
  expect(error !== null, 'transferLoan throws when member 3 has no open loan of book 3').toBe(true);
  expect(snapshot(db), 'the loans table afterwards').toBe(before);
});

test('when the other member does not exist it throws and the first loan stays open', () => {
  const { db, before, error } = attempt({ fromMember: 2, toMember: 99, bookId: 1, today: '2026-03-12' });
  expect(error !== null, 'transferLoan throws for member 99').toBe(true);
  expect(snapshot(db), 'the loans table afterwards').toBe(before);
});

test('after a failure the connection can start a new transaction', () => {
  const { db } = attempt({ fromMember: 2, toMember: 99, bookId: 1, today: '2026-03-12' });
  expect(() => {
    db.exec('BEGIN');
    db.exec('ROLLBACK');
  }, 'BEGIN after the failed transfer').not.toThrow();
});
