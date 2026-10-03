import type { HabitSummary } from '../domain/types.ts';

// Web client: describes the list item it would render with React DOM.
export function webRow(summary: HabitSummary): string {
  return `web:    <li>${summary.name}: ${summary.completionCount}${summary.doneOnDay ? ' ✓' : ''}</li>`;
}
