// indexSql: the CREATE INDEX statement(s) for the query in data.js:
//   SELECT id, bookId, loanedOn FROM loans WHERE memberId = ? AND returnedOn IS NULL ORDER BY loanedOn DESC
// Finds the member's rows, but they still have to be sorted afterwards.
export const indexSql = 'CREATE INDEX loans_member ON loans (memberId)';
