// The habit repository: the current list of habits and its saving, in one place. The same
// repository is written twice, as a class and as a factory function; both have the same methods
// and pass the same tests (tests/repository.test.js). The page uses the class.
import { addHabit, updateHabit, removeHabit, completeHabit, summarizeHabit } from "../domain/habits.ts";
import { saveHabits } from "./habits.ts";

// The class keeps the list and the storage in private fields: code outside the class cannot read
// or replace them, so every change goes through a method, and every method saves.
export class HabitRepository {
  #storage;
  #habits;

  constructor(storage, habits) {
    this.#storage = storage;
    this.#habits = [...habits];
  }

  // A read-only getter: a copy of the list, so changing the returned array changes nothing here.
  get items() {
    return [...this.#habits];
  }

  // Adds a habit if the draft passes validateHabit; an invalid draft changes nothing.
  add(id, input) {
    const next = addHabit(this.#habits, id, input);
    if (next !== this.#habits) {
      this.#habits = next;
      saveHabits(this.#storage, this.#habits);
    }
  }

  update(id, changes) {
    this.#habits = updateHabit(this.#habits, id, changes);
    saveHabits(this.#storage, this.#habits);
  }

  remove(id) {
    this.#habits = removeHabit(this.#habits, id);
    saveHabits(this.#storage, this.#habits);
  }

  // Adds the day ("YYYY-MM-DD", not earlier than the stored dates) to the habit's completions;
  // a day that is already there is not added again.
  markCompleted(id, day) {
    this.#habits = completeHabit(this.#habits, id, day);
    saveHabits(this.#storage, this.#habits);
  }

  // The share of the given days on which the habit was completed; 0 for an unknown habit.
  completionRate(id, days) {
    const habit = this.#habits.find((one) => one.id === id);
    if (habit === undefined) {
      return 0;
    }
    return summarizeHabit(habit, days).rate;
  }
}

// The same repository as a factory: the closure keeps the list and the storage, and the methods
// use them directly, without `this`. So a method still works when it is passed on alone.
export function createHabitRepository(storage, initialHabits) {
  let habits = [...initialHabits];

  function replace(next) {
    habits = next;
    saveHabits(storage, habits);
  }

  return {
    get items() {
      return [...habits];
    },
    add(id, input) {
      const next = addHabit(habits, id, input);
      if (next !== habits) {
        replace(next);
      }
    },
    update(id, changes) {
      replace(updateHabit(habits, id, changes));
    },
    remove(id) {
      replace(removeHabit(habits, id));
    },
    markCompleted(id, day) {
      replace(completeHabit(habits, id, day));
    },
    completionRate(id, days) {
      const habit = habits.find((one) => one.id === id);
      return habit === undefined ? 0 : summarizeHabit(habit, days).rate;
    },
  };
}
