export type Frequency = 'daily' | 'weekly';

export type Habit = {
  readonly id: string;
  name: string;
  frequency: Frequency;
  active: boolean;
  completions: string[]; // unique "YYYY-MM-DD" dates, sorted
};

export type HabitSummary = { name: string; completionCount: number; doneOnDay: boolean };

export type Validation =
  | { ok: true; value: { name: string; frequency: Frequency } }
  | { ok: false; errors: Record<string, string> };
