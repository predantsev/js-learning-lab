// One habit. JSX puts every value in as text, so a name with markup stays text.
import { frequencyText } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";
import { formatDay, LOCALE } from "./format.js";

type HabitCardProps = { habit: Habit; today: string };

export function HabitCard({ habit, today }: HabitCardProps) {
  // The completions are sorted, so the last one is the latest day (undefined when there is none).
  const lastDone = habit.completions.at(-1);
  return (
    <li className="card">
      <h3>{habit.name}</h3>
      <p>%%valueLabel%%: {frequencyText(habit.frequency)}</p>
      <p>%%completionsLabel%%: {habit.completions.length}</p>
      {lastDone !== undefined && <p>%%lastDoneLabel%%: {formatDay(lastDone, LOCALE)}</p>}
      {habit.completions.includes(today) && <p>%%doneTodayMark%%</p>}
      {!habit.active && <p className="badge">%%pausedMark%%</p>}
    </li>
  );
}
