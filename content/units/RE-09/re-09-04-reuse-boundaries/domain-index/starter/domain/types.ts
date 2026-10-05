// Domain types and constants. Read-only.
export type Frequency = "daily" | "weekly";

export type Habit = {
  readonly id: string;
  name: string;
  frequency: Frequency;
  active: boolean;
  completions: string[]; // unique "YYYY-MM-DD" dates, sorted
};

export type HabitSummary = { id: string; completions: number; lastDone: string | null };

export const FREQUENCIES: readonly Frequency[] = ["daily", "weekly"];
