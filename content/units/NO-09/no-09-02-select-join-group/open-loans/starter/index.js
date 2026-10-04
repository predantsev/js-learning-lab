// Prints how many open loans (returnedOn IS NULL) each member of the library has.
import { createLibrary } from './library.js';
import { openLoanCounts } from './app.js';

const db = createLibrary();
for (const row of openLoanCounts(db)) console.log(`${row.name}: ${row.open}`);
db.close();
