// useTasks(startingTasks) — the data hook of the task list.
// - Returns [tasks, dispatch]: the current list and the dispatch of tasksReducer.
// - Start: the tasks saved under jsll.planner.v1 (checked by loadTasks), read on the first render
//   only; without usable saved tasks, `startingTasks`.
// - Effect: writes the whole list with saveTasks after every change of it (dependency [tasks]).
// - Cleanup: none — a write switches nothing on.
import { useEffect, useReducer } from "react";
import type { Dispatch } from "react";
import { loadTasks, saveTasks } from "../storage/tasks.ts";
import type { Task } from "../domain/tasks.ts";
import { tasksReducer } from "./tasksReducer.ts";
import type { TasksAction } from "./tasksReducer.ts";

// The third argument of useReducer works like the function given to useState: React calls it with
// the second argument on the first render only.
function readSaved(startingTasks: Task[]): Task[] {
  const saved = loadTasks(localStorage);
  return saved.ok ? saved.tasks : startingTasks;
}

export function useTasks(startingTasks: Task[]): [Task[], Dispatch<TasksAction>] {
  const [tasks, dispatch] = useReducer(tasksReducer, startingTasks, readSaved);

  useEffect(() => {
    saveTasks(localStorage, tasks);
  }, [tasks]);

  return [tasks, dispatch];
}
