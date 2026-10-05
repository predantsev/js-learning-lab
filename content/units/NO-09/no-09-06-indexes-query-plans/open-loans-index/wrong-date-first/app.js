// indexSql: the CREATE INDEX statement(s) for the query in data.js:
//   SELECT id, bookId, loanedOn FROM loans WHERE memberId = ? AND returnedOn IS NULL ORDER BY loanedOn DESC
// The date comes first, so the rows of one member are spread all over the index.
export const indexSql = 'CREATE INDEX loans_date_member ON loans (loanedOn, memberId)';
