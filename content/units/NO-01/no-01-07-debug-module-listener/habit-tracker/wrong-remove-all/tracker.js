// Misconception: removeAllListeners clears "my" old listener. It also removes every record
// listener that other parts of the program added to the source.
import { format } from 'node:util';
import { currentStreak } from './domain/streak.js';
import fixtures from './fixtures.cjs';

const { loadHabits } = fixtures;

export function createTracker(source) {
  const streaks = new Map();
  const names = new Map();
  const stats = { processed: 0 };

  function reload() {
    streaks.clear();
    source.removeAllListeners('record');
    source.on('record', (habit) => {
      stats.processed += 1;
      if (!habit.active) return;
      names.set(habit.id, habit.name);
      streaks.set(habit.id, currentStreak(habit.completions, source.today));
    });
    source.load(loadHabits());
  }

  function summary() {
    return [...streaks].map(([id, streak]) => format('%s: %d', names.get(id), streak));
  }

  return { reload, summary, streaks, stats };
}
