import type { Task } from './types.ts';

// The domain is fixed, but index.ts still calls countDueTasks(today) the old way.
export function countDueTasks(tasks: Task[], today: string): number {
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
}
