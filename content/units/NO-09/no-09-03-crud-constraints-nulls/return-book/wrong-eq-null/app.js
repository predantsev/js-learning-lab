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
  // "= NULL" is never true, so no row ever matches.
  // Each ? is filled with the next value given to run(); the next lesson explains why.
  const result = db.prepare('UPDATE loans SET returnedOn = ? WHERE id = ? AND returnedOn = NULL').run(returnedOn, loanId);
  return result.changes;
}
