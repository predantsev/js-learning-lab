// The shared contract of the habits API, v1 (read-only). Server, web client and native companion import it.

export type HabitV1 = {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  active: boolean;
  completions: string[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// The runtime schema: one message per broken promise ("frequency: expected daily or weekly"); [] when valid.
// Fields that the contract does not name are allowed: adding a field is a compatible change.
export function parseHabitV1(value: unknown): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return ['habit: expected an object'];
  const habit = value as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof habit.id !== 'string' || habit.id === '') errors.push('id: expected a non-empty string');
  if (typeof habit.name !== 'string') errors.push('name: expected a string');
  if (habit.frequency !== 'daily' && habit.frequency !== 'weekly') errors.push('frequency: expected daily or weekly');
  if (typeof habit.active !== 'boolean') errors.push('active: expected boolean');
  if (!Array.isArray(habit.completions) || !habit.completions.every((day) => typeof day === 'string' && DATE.test(day))) {
    errors.push('completions: expected YYYY-MM-DD dates');
  }
  return errors;
}
