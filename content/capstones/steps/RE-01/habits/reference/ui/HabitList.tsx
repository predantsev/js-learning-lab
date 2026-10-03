// The list of habits: one HabitCard per habit, keyed by the habit's id, or a message when there are none.
import type { Habit } from "../domain/habits.ts";
import { HabitCard } from "./HabitCard.tsx";

type HabitListProps = { habits: Habit[]; today: string };

export function HabitList({ habits, today }: HabitListProps) {
  if (habits.length === 0) {
    return <p>%%emptyMessage%%</p>;
  }
  return (
    <ul className="cards">
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} today={today} />
      ))}
    </ul>
  );
}
