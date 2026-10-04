export type Task = { id: string; title: string; dueDate: string | null; done: boolean; priority: 'low' | 'normal' | 'high' };

export const fixtures: Task[] = [
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%books%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: '%%grandma%%', dueDate: null, done: false, priority: 'low' },
];
