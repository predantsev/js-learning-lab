import type { Task } from './types.ts';

// Misconception: the parameter was added, but the domain still reads localStorage itself.
export function countDueTasks(tasks: Task[], today: string): number {
  const raw = localStorage.getItem('jsll.planner.v1');
  const saved: Task[] = raw === null ? tasks : JSON.parse(raw).records;
  return saved.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
}
