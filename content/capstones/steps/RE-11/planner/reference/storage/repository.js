// The planner repository: the current list of tasks and its saving, in one place. The same
// repository is written twice, as a class and as a factory function; both have the same methods
// and pass the same tests (tests/repository.test.js). The page uses the class.
import { addTask, updateTask, removeTask, countDueTasks } from "../domain/tasks.ts";
import { saveTasks } from "./tasks.ts";

// The class keeps the list and the storage in private fields: code outside the class cannot read
// or replace them, so every change goes through a method, and every method saves.
export class PlannerRepository {
  #storage;
  #tasks;

  constructor(storage, tasks) {
    this.#storage = storage;
    this.#tasks = [...tasks];
  }

  // A read-only getter: a copy of the list, so changing the returned array changes nothing here.
  get items() {
    return [...this.#tasks];
  }

  // Adds a task if the draft passes validateTask; an invalid draft changes nothing.
  add(id, input) {
    const next = addTask(this.#tasks, id, input);
    if (next !== this.#tasks) {
      this.#tasks = next;
      saveTasks(this.#storage, this.#tasks);
    }
  }

  update(id, changes) {
    this.#tasks = updateTask(this.#tasks, id, changes);
    saveTasks(this.#storage, this.#tasks);
  }

  remove(id) {
    this.#tasks = removeTask(this.#tasks, id);
    saveTasks(this.#storage, this.#tasks);
  }

  // A done task becomes pending, a pending task becomes done.
  toggleDone(id) {
    const task = this.#tasks.find((one) => one.id === id);
    if (task === undefined) {
      return;
    }
    this.update(id, { done: !task.done });
  }

  // How many pending tasks are due on or before the day ("YYYY-MM-DD").
  countDueBy(day) {
    return countDueTasks(this.#tasks, day);
  }
}

// The same repository as a factory: the closure keeps the list and the storage, and the methods
// use them directly, without `this`. So a method still works when it is passed on alone.
export function createPlannerRepository(storage, initialTasks) {
  let tasks = [...initialTasks];

  function replace(next) {
    tasks = next;
    saveTasks(storage, tasks);
  }

  return {
    get items() {
      return [...tasks];
    },
    add(id, input) {
      const next = addTask(tasks, id, input);
      if (next !== tasks) {
        replace(next);
      }
    },
    update(id, changes) {
      replace(updateTask(tasks, id, changes));
    },
    remove(id) {
      replace(removeTask(tasks, id));
    },
    toggleDone(id) {
      const task = tasks.find((one) => one.id === id);
      if (task !== undefined) {
        replace(updateTask(tasks, id, { done: !task.done }));
      }
    },
    countDueBy(day) {
      return countDueTasks(tasks, day);
    },
  };
}
