export type Habit = {
  readonly id: string;
  name: string;
  completions: string[]; // unique "YYYY-MM-DD" dates, sorted
};
