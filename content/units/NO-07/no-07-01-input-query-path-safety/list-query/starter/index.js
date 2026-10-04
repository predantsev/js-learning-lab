// Prints what parseListQuery returns for a few query strings (read-only; Check sends many more).
import { parseListQuery } from './query.js';

const queries = ['', 'limit=2&sort=price', 'limit=1e1', 'sort=constructor', 'limit=5&limit=500', 'debug=1'];
for (const query of queries) {
  console.log(`?${query} → ${JSON.stringify(parseListQuery(new URLSearchParams(query)))}`);
}
