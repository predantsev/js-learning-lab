// The types shared by the habit modules. Read-only.
export interface Habit {
  id: string;
  name: string;
  active: boolean;
  completions: readonly string[];
}

export interface HabitSummary {
  count: number;
  doneToday: number;
  completions: number;
}
