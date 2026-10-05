// Demo (read-only): what restoreSnapshot makes of texts a relaunched app could find in storage.
import { restoreSnapshot } from './restore.ts';

const texts = {
  nothing: null,
  current: JSON.stringify({
    schemaVersion: 1,
    records: [{ id: 'h-01', name: ' %%exercise%% ', frequency: 'daily', active: true, completions: ['2026-03-01'] }],
  }),
  v0: JSON.stringify({ schemaVersion: 0, records: [{ id: 'h-03', name: '%%water%%', active: true, completions: [] }] }),
  damaged: '{"schemaVersion":1,"records":[{"id":"h-0',
};

for (const [name, raw] of Object.entries(texts)) {
  console.log(name, '→', JSON.stringify(restoreSnapshot(raw)));
}
