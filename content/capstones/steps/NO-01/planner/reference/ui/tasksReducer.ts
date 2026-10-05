// Every change of the task list as a typed action and one pure reducer: (list, action) => next list.
// Since the async data step the fixture API (data/api.ts) applies these actions to its own list.
// The reducer never changes the list it receives; the domain functions compute every new list, and an
// action the domain rejects (an invalid draft, an unknown id) returns the same list.
import { addTask, updateTask, removeTask, validateTask } from "../domain/tasks.ts";
import type { Task } from "../domain/tasks.ts";

// What a saved task consists of, besides its id.
export type TaskFields = Omit<Task, "id">;

// A discriminated union on `type`: tsc rejects a misspelled type or a missing field.
export type TasksAction =
  | { type: "added"; fields: TaskFields }
  | { type: "updated"; id: string; fields: TaskFields }
  | { type: "removed"; id: string }
  | { type: "doneToggled"; id: string };

// An id that no task of the list has yet (saved tasks may already use "t-7").
export function newId(list: Task[]): string {
  let number = list.length + 1;
  while (list.some((task) => task.id === "t-" + number)) {
    number += 1;
  }
  return "t-" + number;
}

export function tasksReducer(tasks: Task[], action: TasksAction): Task[] {
  switch (action.type) {
    case "added":
      return addTask(tasks, newId(tasks), action.fields);
    case "updated":
      // updateTask copies any changes, so the draft is checked here first.
      if (!validateTask(action.fields).ok) {
        return tasks;
      }
      return updateTask(tasks, action.id, action.fields);
    case "removed":
      return removeTask(tasks, action.id);
    case "doneToggled": {
      const task = tasks.find((one) => one.id === action.id);
      return task === undefined ? tasks : updateTask(tasks, action.id, { done: !task.done });
    }
    default: {
      // Every type is handled above, so here the action has the type never; a new action type
      // that is not handled makes tsc report this line.
      const unhandled: never = action;
      throw new Error("Unknown action: " + JSON.stringify(unhandled));
    }
  }
}
