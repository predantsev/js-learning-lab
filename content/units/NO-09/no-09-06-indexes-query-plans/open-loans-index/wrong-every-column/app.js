// indexSql: the CREATE INDEX statement(s) for the query in data.js:
//   SELECT id, bookId, loanedOn FROM loans WHERE memberId = ? AND returnedOn IS NULL ORDER BY loanedOn DESC
// One index per column "to be safe".
export const indexSql = `
  CREATE INDEX loans_member ON loans (memberId);
  CREATE INDEX loans_returned ON loans (returnedOn);
  CREATE INDEX loans_date ON loans (loanedOn);
`;
