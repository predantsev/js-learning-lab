// The API the screen talks to, given through a context. Read-only.
import { createContext, useContext } from "react";

export type Task = { readonly id: string; title: string };

export type TasksApi = {
  createTask(title: string): Promise<Task>;
};

export const TasksApiContext = createContext<TasksApi | null>(null);

export function useTasksApi(): TasksApi {
  const api = useContext(TasksApiContext);
  if (api === null) throw new Error("useTasksApi must be used inside <TasksApiContext value={api}>");
  return api;
}
