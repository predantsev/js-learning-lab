// The CP-RN enhancement of the planner: the overdue section — the pending tasks due before the given
// day, the high priority first, then the earlier due date. Pure: Node.js and Jest test it; the screen
// only shows it. The day is passed in (from the clock adapter), never read here.
import type { Priority, Task } from "../domain/tasks.ts";

const RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

export function overdueTasks(tasks: Task[], day: string): Task[] {
  const overdue: { task: Task; due: string }[] = [];
  for (const task of tasks) {
    if (!task.done && task.dueDate !== null && task.dueDate < day) {
      overdue.push({ task: task, due: task.dueDate });
    }
  }
  return overdue.toSorted((a, b) => RANK[a.task.priority] - RANK[b.task.priority] || a.due.localeCompare(b.due)).map((entry) => entry.task);
}
