import type { Habit } from "./habits";

export type HabitAction =
  | { type: "added"; habit: Habit }
  | { type: "updated"; id: string; name: string }
  | { type: "removed"; id: string }
  | { type: "activeToggled"; id: string };

export function habitsReducer(habits: Habit[], action: HabitAction): Habit[] {
  switch (action.type) {
    case "added":
      return [...habits, action.habit];
    case "updated":
      return habits.map((habit) => (habit.id === action.id ? { ...habit, name: action.name } : habit));
    case "removed":
      return habits.filter((habit) => habit.id !== action.id);
    case "activeToggled":
      return habits.map((habit) => ({ ...habit, active: !habit.active }));
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}
