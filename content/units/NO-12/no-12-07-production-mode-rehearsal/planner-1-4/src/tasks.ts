export type Priority = 'low' | 'normal' | 'high';
export type Task = { id: string; title: string; dueDate: string | null; done: boolean; priority: Priority };

export const fixtures: Task[] = [
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%books%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: '%%grandma%%', dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: '%%internet%%', dueDate: '2026-02-27', done: true, priority: 'high' },
];

const rank: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

// High priority first; inside one priority, the earlier due date first (no date last).
export function byPriority(a: Task, b: Task): number {
  return rank[a.priority] - rank[b.priority] || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
}
