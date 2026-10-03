// A React DOM view. Read-only.
import { summarizeHabit } from "../domain/summarize";
import type { Habit } from "../domain/types";

export function HabitCard({ habit, onDone }: { habit: Habit; onDone: () => void }) {
  const summary = summarizeHabit(habit);
  return (
    <li>
      <strong>{habit.name}</strong> — %%completions%% {summary.completions}, %%lastDone%% {summary.lastDone ?? "—"}{" "}
      <button onClick={onDone}>%%doneToday%%</button>
    </li>
  );
}
