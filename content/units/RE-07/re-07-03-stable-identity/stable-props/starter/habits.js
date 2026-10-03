export const HABITS = [
  { id: "h-01", name: "%%exercise%%", active: true, completions: ["2026-02-27", "2026-02-28", "2026-03-01"] },
  { id: "h-02", name: "%%reading%%", active: true, completions: ["2026-02-26", "2026-02-28", "2026-03-01"] },
  { id: "h-03", name: "%%water%%", active: true, completions: ["2026-03-01"] },
  { id: "h-04", name: "%%tidy%%", active: true, completions: ["2026-02-22", "2026-03-01"] },
  { id: "h-05", name: "%%words%%", active: false, completions: ["2026-02-20"] },
  { id: "h-06", name: "%%walk%%", active: true, completions: [] },
];

let calls = 0;

// Keeps only active habits. Counts its calls so the checks can see how often it runs.
export function activeHabits(habits) {
  calls += 1;
  return habits.filter((habit) => habit.active);
}

export function activeHabitsCalls() {
  return calls;
}
