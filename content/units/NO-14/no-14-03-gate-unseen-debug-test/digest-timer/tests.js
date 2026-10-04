// Checks of the digest on a fake clock (no real waiting): the settings after a reload, the new
// interval, one live timer, and nothing left after stop(). The settings and members are made here.
import { createDigest } from './digest.js';
import { fakeTimers } from './fake-timers.js';

const MINUTE = 60_000;
function start() {
  const timers = fakeTimers();
  const sent = [];
  let stored = { language: 'uk', topCount: 3, everyMs: 60 * MINUTE };
  const members = [
    { name: 'A', pagesRead: 10 },
    { name: 'B', pagesRead: 40 },
    { name: 'C', pagesRead: 25 },
    { name: 'D', pagesRead: 5 },
  ];
  const digest = createDigest({
    loadConfig: () => ({ ...stored }),
    summary: () => members,
    send: (message) => sent.push({ at: timers.now() / MINUTE, ...message }),
    timers,
  });
  return { timers, sent, digest, change: (next) => { stored = next; } };
}

test('before a reload, digests follow the first settings', () => {
  const { timers, sent, digest } = start();
  timers.advance(125 * MINUTE);
  digest.stop();
  expect(sent, 'digests in the first 125 minutes').toEqual([
    { at: 60, language: 'uk', names: ['B', 'C', 'A'] },
    { at: 120, language: 'uk', names: ['B', 'C', 'A'] },
  ]);
});

test('after a reload, the next digest uses the new language and top count', () => {
  const { timers, sent, digest, change } = start();
  timers.advance(10 * MINUTE);
  change({ language: 'en', topCount: 2, everyMs: 60 * MINUTE });
  digest.reload();
  timers.advance(60 * MINUTE);
  digest.stop();
  // A digest at minute 60 (the old rhythm) or at 70 (rescheduled at the reload) are both fine.
  expect(sent.map(({ at, ...message }) => message), 'digests in the 60 minutes after the reload at minute 10').toEqual([{ language: 'en', names: ['B', 'C'] }]);
});

test('after a reload with a new interval, digests follow it', () => {
  const { timers, sent, digest, change } = start();
  timers.advance(10 * MINUTE);
  change({ language: 'uk', topCount: 3, everyMs: 20 * MINUTE });
  digest.reload();
  timers.advance(60 * MINUTE);
  digest.stop();
  expect(sent.map((message) => message.at), 'minutes of the digests after a reload at minute 10 to every 20 minutes').toEqual([30, 50, 70]);
});

test('exactly one timer is live after reloads, and none after stop()', () => {
  const { timers, digest, change } = start();
  change({ language: 'en', topCount: 2, everyMs: 30 * MINUTE });
  digest.reload();
  change({ language: 'uk', topCount: 1, everyMs: 45 * MINUTE });
  digest.reload();
  expect(timers.liveCount(), 'live timers after two reloads').toBe(1);
  digest.stop();
  expect(timers.liveCount(), 'live timers after stop()').toBe(0);
});
