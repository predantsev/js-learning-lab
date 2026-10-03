import type { Habit } from "./habits";

type Added = { type: "added"; habit: Habit };
type Updated = { type: "updated"; id: string; name: string };
type Removed = { type: "removed"; id: string };
type ActiveToggled = { type: "activeToggled"; id: string };

export type HabitAction = Added | Updated | Removed | ActiveToggled;

// The same transitions written with if: each branch narrows the action to one member.
export function habitsReducer(habits: Habit[], action: HabitAction): Habit[] {
  if (action.type === "added") {
    return habits.concat([action.habit]);
  }
  if (action.type === "removed") {
    return habits.filter((habit) => habit.id !== action.id);
  }
  return habits.map((habit) => {
    if (habit.id !== action.id) return habit;
    if (action.type === "updated") return { ...habit, name: action.name };
    return { ...habit, active: !habit.active };
  });
}
