// Every change of the habit list as a typed action and one pure reducer: (list, action) => next list.
// The reducer never changes the list it receives; the domain functions compute every new list, and an
// action the domain rejects (an invalid draft, an unknown id, a day already recorded) returns the
// same list.
import { addHabit, updateHabit, removeHabit, completeHabit, validateHabit } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";

// What the form saves: the completions are never typed, they stay as they are.
export type HabitFields = Pick<Habit, "name" | "frequency" | "active">;

// A discriminated union on `type`: tsc rejects a misspelled type or a missing field.
export type HabitsAction =
  | { type: "added"; fields: HabitFields }
  | { type: "updated"; id: string; fields: HabitFields }
  | { type: "removed"; id: string }
  | { type: "activeToggled"; id: string }
  | { type: "completionAdded"; id: string; day: string };

// An id that no habit of the list has yet (saved habits may already use "h-7").
export function newId(list: Habit[]): string {
  let number = list.length + 1;
  while (list.some((habit) => habit.id === "h-" + number)) {
    number += 1;
  }
  return "h-" + number;
}

export function habitsReducer(habits: Habit[], action: HabitsAction): Habit[] {
  switch (action.type) {
    case "added":
      return addHabit(habits, newId(habits), action.fields);
    case "updated":
      // updateHabit copies any changes, so the draft is checked here first.
      if (!validateHabit(action.fields).ok) {
        return habits;
      }
      return updateHabit(habits, action.id, action.fields);
    case "removed":
      return removeHabit(habits, action.id);
    case "activeToggled": {
      const habit = habits.find((one) => one.id === action.id);
      return habit === undefined ? habits : updateHabit(habits, action.id, { active: !habit.active });
    }
    case "completionAdded": {
      // The day comes with the action; completeHabit adds it once, as a new completions array. For a
      // day that is already there every habit stays the same object, and then the reducer returns the
      // received list itself: React sees no change, so nothing is drawn or saved again.
      const next = completeHabit(habits, action.id, action.day);
      return next.every((habit, index) => habit === habits[index]) ? habits : next;
    }
    default: {
      // Every type is handled above, so here the action has the type never; a new action type
      // that is not handled makes tsc report this line.
      const unhandled: never = action;
      throw new Error("Unknown action: " + JSON.stringify(unhandled));
    }
  }
}
