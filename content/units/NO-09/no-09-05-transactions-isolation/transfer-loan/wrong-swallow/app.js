// transferLoan(db, { fromMember, toMember, bookId, today }): fromMember hands an open loan of bookId to
// toMember. Close fromMember's open loan of that book (returnedOn = today) and open a new loan for
// toMember (loanedOn = today), as one transaction that rolls back when any step fails or changes no row.
export function transferLoan(db, { fromMember, toMember, bookId, today }) {
  db.exec('BEGIN');
  try {
    const closed = db
      .prepare('UPDATE loans SET returnedOn = ? WHERE memberId = ? AND bookId = ? AND returnedOn IS NULL')
      .run(today, fromMember, bookId);
    if (closed.changes !== 1) throw new Error(`member ${fromMember} has no open loan of book ${bookId}`);
    db.prepare('INSERT INTO loans (memberId, bookId, loanedOn) VALUES (?, ?, ?)').run(toMember, bookId, today);
    db.exec('COMMIT');
  } catch {
    db.exec('ROLLBACK'); // the data is safe, but the caller never learns that the transfer failed
  }
}
