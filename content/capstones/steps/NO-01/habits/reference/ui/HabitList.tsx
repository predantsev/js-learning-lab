// The list of habits: one HabitCard per habit, keyed by the habit's id, or a message when there are none.
import type { Habit } from "../domain/habits.ts";
import { HabitCard } from "./HabitCard.tsx";

type HabitListProps = {
  habits: Habit[];
  today: string;
  emptyText: string;
  onMarkToday: (habit: Habit) => void;
  onToggleActive: (habit: Habit) => void;
  onRemove: (id: string) => void;
};

export function HabitList({ habits, today, emptyText, onMarkToday, onToggleActive, onRemove }: HabitListProps) {
  if (habits.length === 0) {
    return <p>{emptyText}</p>;
  }
  return (
    <ul className="cards">
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} today={today} onMarkToday={onMarkToday} onToggleActive={onToggleActive} onRemove={onRemove} />
      ))}
    </ul>
  );
}
