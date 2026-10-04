export type Priority = 'low' | 'normal' | 'high';
export type Task = { id: string; title: string; done: boolean; priority: Priority };

const rank: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

// High priority first.
export function byPriority(a: Task, b: Task): number {
  return rank[a.priority] - rank[b.priority];
}

export function pendingCount(tasks: Task[]): number {
  return tasks.filter((task) => !task.done).length;
}
