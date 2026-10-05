// Demo (read-only): runs migrate over snapshots an older and a newer app version could have left.
import { migrate } from './migrate.js';

const samples = {
  'v0 (old app)': {
    schemaVersion: 0,
    records: [
      { id: 't-01', title: '%%plants%%', due: '2026-03-02', done: false, priority: 'normal' },
      { id: 't-03', title: '%%grandma%%', due: '', done: false, priority: 'low' },
    ],
  },
  'v1 (now)': {
    schemaVersion: 1,
    records: [{ id: 't-05', title: '%%dentist%%', dueDate: '2026-03-10', done: false, priority: 'normal' }],
  },
  'v7 (newer app)': { schemaVersion: 7, records: [] },
  'no records': { schemaVersion: 1 },
};

for (const [name, snapshot] of Object.entries(samples)) {
  console.log(name, '→', JSON.stringify(migrate(snapshot)));
}
