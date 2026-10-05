// Loads two stored texts through your contract: a good one and one with problems.
import { parseStore } from './app.js';

const good = JSON.stringify({
  schemaVersion: 1,
  records: [
    { id: 'n-01', title: '%%shopping%%', body: '%%shoppingBody%%', pinned: true },
    { id: 'n-02', title: '%%ideas%%' },
  ],
});
const bad = JSON.stringify({
  schemaVersion: 1,
  records: [
    { id: 'n-01', title: 7, body: '' },
    { id: 'n-01', title: '%%ideas%%', colour: 'yellow' },
  ],
});

for (const text of [good, bad]) {
  try {
    console.log(JSON.stringify(parseStore(text).records));
  } catch (error) {
    console.log(`%%rejected%%: ${error.message}`);
    for (const problem of error.problems ?? []) console.log(`  ${problem}`);
  }
}
