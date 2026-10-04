// Keeps the streak of every active habit; reload() reads the fixtures again through the source.
import { format } from 'node:util';
import { currentStreak } from './domain/streak';
import { loadHabits } from './fixtures.cjs';

export function createTracker(source) {
  const streaks = new Map();
  const names = new Map();
  const stats = { processed: 0 };

  function reload() {
    streaks.clear();
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
