// Type tests: `npx tsc --noEmit` checks this file, nothing runs it. Every `@ts-expect-error` must meet a
// real type error on the next line; when the type stops refusing it, tsc reports the unused directive.
import type { Task } from '../../domain/tasks.ts';

export const valid: Task = { id: 't-01', title: 'Water the plants', dueDate: '2026-03-02', done: false, priority: 'normal' };

// @ts-expect-error a priority is "low", "normal" or "high", nothing else
export const urgent: Task = { id: 't-01', title: 'Water the plants', dueDate: null, done: false, priority: 'urgent' };

// @ts-expect-error a missing due date is null, not undefined
export const noDueDate: Task = { id: 't-01', title: 'Water the plants', dueDate: undefined, done: false, priority: 'low' };
