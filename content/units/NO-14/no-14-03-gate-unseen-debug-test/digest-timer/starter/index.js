// The report, replayed on a fake clock: digests every 60 minutes in Ukrainian with the top 3;
// at minute 90 an admin switches to English, the top 2 and every 30 minutes, and reloads.
import { createDigest } from './digest.js';
import { fakeTimers } from './fake-timers.js';

const MINUTE = 60_000;
const members = [
  { name: `%%lina%%`, pagesRead: 50 },
  { name: `%%denys%%`, pagesRead: 55 },
  { name: `%%olya%%`, pagesRead: 30 },
  { name: `%%yarema%%`, pagesRead: 12 },
];
let stored = { language: 'uk', topCount: 3, everyMs: 60 * MINUTE };
const timers = fakeTimers();
const digest = createDigest({
  loadConfig: () => ({ ...stored }),
  summary: () => members,
  send: (message) => console.log(`${timers.now() / MINUTE} min · ${message.language} · ${message.names.join(', ')}`),
  timers,
});

timers.advance(90 * MINUTE);
stored = { language: 'en', topCount: 2, everyMs: 30 * MINUTE };
digest.reload();
console.log(`90 min · %%reloaded%% ${JSON.stringify(digest.settings())}`);
timers.advance(90 * MINUTE);
digest.stop();
console.log(`%%timersLeft%% ${timers.liveCount()}`);
