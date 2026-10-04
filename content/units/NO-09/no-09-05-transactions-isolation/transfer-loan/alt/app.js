// transferLoan(db, { fromMember, toMember, bookId, today }): fromMember hands an open loan of bookId to
// toMember. Close fromMember's open loan of that book (returnedOn = today) and open a new loan for
// toMember (loanedOn = today), as one transaction that rolls back when any step fails or changes no row.
function inTransaction(db, work) {
  db.exec('BEGIN IMMEDIATE'); // take the write lock at once
  let done = false;
  try {
    const result = work();
    db.exec('COMMIT');
    done = true;
    return result;
  } finally {
    if (!done) db.exec('ROLLBACK');
  }
}

export function transferLoan(db, { fromMember, toMember, bookId, today }) {
  inTransaction(db, () => {
    const open = db
      .prepare('SELECT id FROM loans WHERE memberId = ? AND bookId = ? AND returnedOn IS NULL')
      .get(fromMember, bookId);
    if (open === undefined) throw new Error('no open loan to transfer');
    db.prepare('UPDATE loans SET returnedOn = ? WHERE id = ?').run(today, open.id);
    db.prepare('INSERT INTO loans (memberId, bookId, loanedOn) VALUES (?, ?, ?)').run(toMember, bookId, today);
  });
}
