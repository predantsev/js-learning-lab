// Habit fixtures in an older CommonJS module (read-only). The exports object is filled in and
// assigned at the end, so Node cannot list its names for a named import.
const habits = [
  { id: 'h-01', name: '%%morning%%', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: '%%reading%%', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: '%%water%%', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: '%%tidy%%', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: '%%words%%', active: false, completions: ['2026-02-20'] },
  { id: 'h-06', name: '%%walk%%', active: true, completions: [] },
];

const api = {};
api.loadHabits = () => habits.map((habit) => ({ ...habit, completions: [...habit.completions] }));
module.exports = api;
