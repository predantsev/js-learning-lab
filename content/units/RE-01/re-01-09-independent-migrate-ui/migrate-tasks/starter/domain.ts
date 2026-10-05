// The pure domain module of the planner. Do not change it: the UI only calls it.
export type Priority = "low" | "normal" | "high";

export interface Task {
  readonly id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
  priority: Priority;
}

// Pending tasks due on or before `today`; a task without a due date is never due.
export function countDueTasks(tasks: readonly Task[], today: string): number {
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
}
