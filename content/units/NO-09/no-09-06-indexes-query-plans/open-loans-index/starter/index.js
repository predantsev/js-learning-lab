// Prints the plan and the time of the "open loans of one member, newest first" query,
// before and after the statements in indexSql (app.js).
import { createLoans, openLoansSql, planOf } from './data.js';
import { indexSql } from './app.js';

const db = createLoans(100000);
const query = db.prepare(openLoansSql);
const timeIt = () => {
  const start = performance.now();
  for (let member = 1; member <= 300; member += 1) query.all(member);
  return (performance.now() - start).toFixed(1);
};

console.log('before:', planOf(db, openLoansSql).join(' | '));
console.log(`300 members: ${timeIt()} ms`);
db.exec(indexSql);
console.log('after: ', planOf(db, openLoansSql).join(' | '));
console.log(`300 members: ${timeIt()} ms`);
db.close();
