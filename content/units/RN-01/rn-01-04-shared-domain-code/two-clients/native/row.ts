import type { HabitSummary } from '../domain/types.ts';

// Stands in for the native screen: describes the Text it would render with React Native.
export function nativeRow(summary: HabitSummary): string {
  return `native: <Text>${summary.name}: ${summary.completionCount}${summary.doneOnDay ? ' ✓' : ''}</Text>`;
}
