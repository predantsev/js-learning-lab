import type { Task } from './types.ts';

// Counts pending tasks due on or before `today`. Tasks without a due date are never due.
// The tasks come in as a parameter: the caller decides where they are stored.
export function countDueTasks(tasks: Task[], today: string): number {
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
}
