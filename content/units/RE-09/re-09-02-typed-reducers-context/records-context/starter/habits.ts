// The habits and a fixture server. Read-only.
export type Habit = { readonly id: string; name: string; active: boolean };

const HABITS: Habit[] = [
  { id: "h-01", name: "%%exercise%%", active: true },
  { id: "h-03", name: "%%water%%", active: true },
  { id: "h-05", name: "%%words%%", active: false },
];

// Answers after 50 ms with a copy of the list, or rejects when `fail` is true.
export function fetchHabits(fail: boolean): Promise<Habit[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) reject(new Error("%%serverDown%%"));
      else resolve(HABITS.map((habit) => ({ ...habit })));
    }, 50);
  });
}
