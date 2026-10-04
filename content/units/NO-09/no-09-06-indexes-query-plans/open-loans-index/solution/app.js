// indexSql: the CREATE INDEX statement(s) for the query in data.js:
//   SELECT id, bookId, loanedOn FROM loans WHERE memberId = ? AND returnedOn IS NULL ORDER BY loanedOn DESC
export const indexSql = 'CREATE INDEX loans_member_date ON loans (memberId, loanedOn)';
