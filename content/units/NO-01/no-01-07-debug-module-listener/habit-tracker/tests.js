// Every check builds a fresh source and tracker, reloads it and looks at the source's listeners.
import { createHabitSource } from './source.js';
import { createTracker } from './tracker.js';

const ACTIVE_STREAKS = [['h-01', 3], ['h-02', 2], ['h-03', 1], ['h-04', 1], ['h-06', 0]];
const HABITS = 6;

function reloaded(times, setup = () => {}) {
  expect(typeof createTracker, 'type of createTracker').toBe('function');
  const source = createHabitSource('2026-03-01');
  setup(source);
  const tracker = createTracker(source);
  for (let i = 0; i < times; i += 1) tracker.reload();
  return { source, tracker };
}

test('reload computes the streak of every active habit', () => {
  const { tracker } = reloaded(2);
  expect([...tracker.streaks], 'streaks after two reloads').toEqual(ACTIVE_STREAKS);
});

test('the record listener count does not grow across reloads', () => {
  const once = reloaded(1).source.listenerCount('record');
  const five = reloaded(5).source.listenerCount('record');
  expect(five, "listenerCount('record') after five reloads (the same as after one)").toBe(once);
  expect(five, "listenerCount('record') after five reloads").toBeLessThanOrEqual(1);
});

test('each reload processes every habit once', () => {
  const { tracker } = reloaded(5);
  expect(tracker.stats.processed, 'stats.processed after five reloads').toBe(5 * HABITS);
});

test('keeps record listeners that others added', () => {
  const seen = [];
  const { source } = reloaded(3, (src) => src.on('record', (habit) => seen.push(habit.id)));
  source.emit('record', { id: 'h-99', active: false, completions: [] });
  expect(seen.length, 'records seen by the other listener').toBe(3 * HABITS + 1);
});

test('leaves the max-listeners limit at 10', () => {
  const { source } = reloaded(1);
  expect(source.getMaxListeners(), 'source.getMaxListeners()').toBe(10);
});
