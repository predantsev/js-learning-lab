// Demo (read-only): a few texts a relaunched plant-watering app could find in storage.
import { prepareSave, restoreSnapshot } from './snapshot.ts';

const texts = {
  nothing: null,
  v1: JSON.stringify({ schemaVersion: 1, records: [{ id: 'p-01', name: '%%fern%%', everyDays: 3, lastWatered: '2026-03-01' }] }),
  v0: JSON.stringify({ schemaVersion: 0, records: [{ id: 'p-02', name: '%%cactus%%', everyDays: '14', lastWatered: '' }] }),
  damaged: '{"schemaVersion":1,"records":[{"id":"p-0',
};

for (const [name, raw] of Object.entries(texts)) {
  console.log(name, '→', JSON.stringify(restoreSnapshot(raw)));
}
console.log('prepareSave →', JSON.stringify(prepareSave([{ id: 'p-03', name: '%%basil%%', everyDays: 2, lastWatered: null }])));
