// The shape of a habit and the starting list. Read-only.
export type Frequency = "daily" | "weekly";

export type Habit = {
  readonly id: string;
  name: string;
  frequency: Frequency;
  active: boolean;
  completions: string[]; // calendar dates "YYYY-MM-DD"
};

export const START_HABITS: Habit[] = [
  { id: "h-01", name: "%%exercise%%", frequency: "daily", active: true, completions: ["2026-02-28", "2026-03-01"] },
  { id: "h-02", name: "%%reading%%", frequency: "daily", active: true, completions: ["2026-03-01"] },
  { id: "h-04", name: "%%tidy%%", frequency: "weekly", active: true, completions: ["2026-02-22"] },
  { id: "h-05", name: "%%words%%", frequency: "daily", active: false, completions: [] },
];

let nextNumber = 6;

// A fresh id for a new habit: "h-06", "h-07", …
export function nextHabitId(): string {
  const id = "h-" + String(nextNumber).padStart(2, "0");
  nextNumber += 1;
  return id;
}
