// Prints the dependency path to each flagged package, then checks the server's query reading.
import { readFile } from 'node:fs/promises';
import { dependencyPaths, installed } from './why.js';
import { readQuery } from './query.js';

const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
for (const name of ['tiny-query', 'csv-tidy', 'glob-lite']) {
  const facts = installed(lock, name);
  const chains = dependencyPaths(lock, name).map((chain) => ['planner-server', ...chain].join(' → '));
  console.log(`${name}@${facts.version} ${facts.devOnly ? '%%devOnly%%' : '%%production%%'}: ${chains.join('; ')}`);
}

// Two small checks of readQuery, the code path every GET /tasks request goes through.
const plain = readQuery('?sort=dueDate&limit=5');
console.log(`%%check%% 1 (sort, limit): ${plain.sort === 'dueDate' && plain.limit === '5' ? 'ok' : 'FAIL'}`);
readQuery('?__proto__[isAdmin]=true&sort=title');
const polluted = {}.isAdmin !== undefined; // does a brand-new empty object now have isAdmin?
console.log(`%%check%% 2 (__proto__): ${polluted ? 'FAIL — {}.isAdmin = ' + JSON.stringify({}.isAdmin) : 'ok'}`);
delete Object.prototype.isAdmin; // clean up, whatever happened
