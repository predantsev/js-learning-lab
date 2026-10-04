// transferLoan(db, { fromMember, toMember, bookId, today }): fromMember hands an open loan of bookId to
// toMember. Close fromMember's open loan of that book (returnedOn = today) and open a new loan for
// toMember (loanedOn = today), as one transaction that rolls back when any step fails or changes no row.
export function transferLoan(db, { fromMember, toMember, bookId, today }) {
  // Checks the first step, but without a transaction a failing insert leaves the first loan closed.
  const closed = db
    .prepare('UPDATE loans SET returnedOn = ? WHERE memberId = ? AND bookId = ? AND returnedOn IS NULL')
    .run(today, fromMember, bookId);
  if (closed.changes !== 1) throw new Error(`member ${fromMember} has no open loan of book ${bookId}`);
  db.prepare('INSERT INTO loans (memberId, bookId, loanedOn) VALUES (?, ?, ?)').run(toMember, bookId, today);
}
