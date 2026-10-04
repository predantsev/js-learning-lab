// Dry-runs the notes migration on a good store and on a store with a damaged note.
import { dryRun, migrate1to2 } from './app.js';

const good = {
  schemaVersion: 1,
  records: [
    { id: 'n-01', title: '%%shopping%%', body: '%%shoppingBody%%', pinned: true },
    { id: 'n-02', title: '%%ideas%%', body: '%%ideasBody%%', pinned: false },
  ],
};
const damaged = { schemaVersion: 1, records: [...good.records, { id: 'n-03', title: '%%draft%%', body: null, pinned: false }] };

function show(label, run) {
  try {
    console.log(`${label}: ${JSON.stringify(run())}`);
  } catch (error) {
    console.log(`${label}: threw ${error.name}: ${error.message}`);
  }
}

show('dryRun(good)', () => dryRun(good));
show('dryRun(damaged)', () => dryRun(damaged));
show('good.schemaVersion', () => good.schemaVersion);
show('migrate1to2(good).records[0]', () => migrate1to2(good).records[0]);
