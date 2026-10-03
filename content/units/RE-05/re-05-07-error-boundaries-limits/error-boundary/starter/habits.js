// h-06 came back from storage damaged: its completions are null instead of an array.
export const habits = [
  { id: "h-01", name: "%%exercise%%", completions: ["2026-02-27", "2026-02-28", "2026-03-01"] },
  { id: "h-03", name: "%%water%%", completions: ["2026-03-01"] },
  { id: "h-06", name: "%%walk%%", completions: null },
];

// For the checks and for trying things out: repair or damage a record again.
export function repairHabit(id) {
  habits.find((habit) => habit.id === id).completions = [];
}
export function breakHabit(id) {
  habits.find((habit) => habit.id === id).completions = null;
}
