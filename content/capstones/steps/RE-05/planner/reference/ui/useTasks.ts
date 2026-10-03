// useTasks() — the data hook of the task list.
// - Returns { tasks, load, dispatch, retry }: the current list, the state of the starting load, the
//   dispatch of tasksReducer and a function that tries the load again after an error.
// - Start: the tasks saved under jsll.planner.v1 (checked by loadTasks), read on the first render
//   only; then `load` is "ready" at once. Without usable saved tasks `load` starts as "loading" and an
//   effect fetches the starting tasks of data/tasks.json.
// - Effects: the fetch, aborted by its cleanup (a newer attempt or an unmount); and the write of the
//   whole list with saveTasks after every change — only once the list is known, so the empty list of
//   a load in progress is never written.
// TasksContext hands the same object to every screen under the router.
import { createContext, useContext, useEffect, useReducer, useState } from "react";
import type { Dispatch } from "react";
import { loadTasks, saveTasks } from "../storage/tasks.ts";
import type { Task } from "../domain/tasks.ts";
import { loadFixtures } from "../data/fixtures.js";
import { tasksReducer } from "./tasksReducer.ts";
import type { TasksAction } from "./tasksReducer.ts";

export type LoadState = { kind: "loading" } | { kind: "ready" } | { kind: "failed"; message: string };

export type TasksData = { tasks: Task[]; load: LoadState; dispatch: Dispatch<TasksAction>; retry: () => void };

// The message for a failed load: the status of an answer that is not ok, no connection (fetch rejects
// with a TypeError), or a damaged file.
function loadErrorText(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    return "%%loadHttpError%% " + String(error.status);
  }
  if (error instanceof TypeError) {
    return "%%loadNetworkError%%";
  }
  return "%%loadDataError%%";
}

export function useTasks(): TasksData {
  // A function given to useState runs on the first render only.
  const [saved] = useState(() => loadTasks(localStorage));
  const [tasks, dispatch] = useReducer(tasksReducer, saved, (first) => (first.ok ? first.tasks : []));
  const [load, setLoad] = useState<LoadState>(saved.ok ? { kind: "ready" } : { kind: "loading" });

  useEffect(() => {
    if (load.kind !== "loading") {
      return;
    }
    const controller = new AbortController();
    loadFixtures(controller.signal).then(
      (records: Task[]) => {
        dispatch({ type: "loaded", tasks: records });
        setLoad({ kind: "ready" });
      },
      (error: unknown) => {
        // An abort is not an error: this attempt was replaced or the page went away.
        if (!controller.signal.aborted) {
          setLoad({ kind: "failed", message: loadErrorText(error) });
        }
      },
    );
    return () => controller.abort();
  }, [load.kind]);

  useEffect(() => {
    if (load.kind === "ready") {
      saveTasks(localStorage, tasks);
    }
  }, [load.kind, tasks]);

  return { tasks: tasks, load: load, dispatch: dispatch, retry: () => setLoad({ kind: "loading" }) };
}

export const TasksContext = createContext<TasksData | null>(null);

// The data of the list for a component under <TasksContext.Provider>.
export function useTasksData(): TasksData {
  const data = useContext(TasksContext);
  if (data === null) {
    throw new Error("useTasksData works only inside <TasksContext.Provider>.");
  }
  return data;
}
