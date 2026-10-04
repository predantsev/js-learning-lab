// Another valid repair: the listener stays inside reload(), but reload() removes it again
// (emit is synchronous, so every record has arrived by the time load() returns).
import { format } from 'node:util';
import { createRequire } from 'node:module';
import { currentStreak } from './domain/streak.js';

const require = createRequire(import.meta.url);
const { loadHabits } = require('./fixtures.cjs');

export function createTracker(source) {
  const streaks = new Map();
  const names = new Map();
  const stats = { processed: 0 };

  function onRecord(habit) {
    stats.processed += 1;
    if (!habit.active) return;
    names.set(habit.id, habit.name);
    streaks.set(habit.id, currentStreak(habit.completions, source.today));
  }

  function reload() {
    streaks.clear();
    source.on('record', onRecord);
    try {
      source.load(loadHabits());
    } finally {
      source.off('record', onRecord);
    }
  }

  function summary() {
    return [...streaks].map(([id, streak]) => format('%s: %d', names.get(id), streak));
  }

  return { reload, summary, streaks, stats };
}
