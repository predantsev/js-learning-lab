import type { Task } from './types.ts';

function isDue(task: Task, today: string): boolean {
  return !task.done && task.dueDate !== null && task.dueDate <= today;
}

export function countDueTasks(tasks: readonly Task[], today: string): number {
  return tasks.reduce((count, task) => (isDue(task, today) ? count + 1 : count), 0);
}
