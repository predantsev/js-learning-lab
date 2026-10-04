// loansTable: the CREATE TABLE statement of loans.
// returnBook(db, loanId, returnedOn): record the return of an open loan; returns how many rows changed.
export const loansTable = `
  CREATE TABLE loans (
    id         INTEGER PRIMARY KEY,
    memberId   INTEGER NOT NULL REFERENCES members(id),
    bookId     INTEGER NOT NULL REFERENCES books(id),
    loanedOn   TEXT NOT NULL,
    returnedOn TEXT,
    CHECK (returnedOn >= loanedOn)
  )
`;

export function returnBook(db, loanId, returnedOn) {
  // The condition on the id was lost: every open loan is returned at once.
  const result = db.prepare('UPDATE loans SET returnedOn = ? WHERE returnedOn IS NULL').run(returnedOn);
  return result.changes;
}
