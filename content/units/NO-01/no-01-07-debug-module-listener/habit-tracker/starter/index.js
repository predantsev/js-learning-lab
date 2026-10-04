// Read-only driver: reloads the tracker eleven times, as a long-running script would.
import { createHabitSource } from './source.js';
import { createTracker } from './tracker.js';

const source = createHabitSource('2026-03-01');
const tracker = createTracker(source);

for (let i = 1; i <= 11; i += 1) {
  tracker.reload();
  if (i === 1 || i === 5 || i === 11) {
    console.log(`reload ${i}: listeners ${source.listenerCount('record')}, %%processed%% ${tracker.stats.processed}`);
  }
}
for (const line of tracker.summary()) console.log(line);
