// Type tests: `npx tsc --noEmit` checks this file, nothing runs it. Every `@ts-expect-error` must meet a
// real type error on the next line; when the type stops refusing it, tsc reports the unused directive.
import type { Habit } from '../../domain/habits.ts';

export const valid: Habit = { id: 'h-01', name: 'Morning exercise', frequency: 'daily', active: true, completions: [] };

// @ts-expect-error a frequency is "daily" or "weekly", nothing else
export const monthly: Habit = { id: 'h-01', name: 'Morning exercise', frequency: 'monthly', active: true, completions: [] };

// @ts-expect-error completions are dates as text, not a count
export const countOnly: Habit = { id: 'h-01', name: 'Morning exercise', frequency: 'daily', active: true, completions: 3 };
