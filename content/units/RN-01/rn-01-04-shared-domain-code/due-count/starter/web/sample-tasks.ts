import type { Task } from '../domain/types.ts';

export const sampleTasks: Task[] = [
  { id: 't-01', title: '%%t01%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%t02%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: '%%t03%%', dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: '%%t04%%', dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-05', title: '%%t05%%', dueDate: '2026-03-10', done: false, priority: 'normal' },
];
