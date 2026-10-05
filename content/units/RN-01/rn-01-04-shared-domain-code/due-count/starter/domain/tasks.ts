import type { Task } from './types.ts';

// Counts pending tasks due on or before `today`. Tasks without a due date are never due.
export function countDueTasks(today: string): number {
  const raw = localStorage.getItem('jsll.planner.v1');
  const tasks: Task[] = raw === null ? [] : JSON.parse(raw).records;
  return tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
}
