// The whole page as a tree of components: App → HabitForm, HabitList → one HabitCard per habit.
// The numbers come from the pure domain functions, which stay exactly as they were.
import { formatRates, sortHabitsByName, filterHabits } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";
import { HabitForm } from "./HabitForm.tsx";
import { HabitList } from "./HabitList.tsx";

type AppProps = { habits: Habit[]; today: string; days: string[] };

export function App({ habits, today, days }: AppProps) {
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/habit.svg" alt="%%imageAlt%%" />
      <HabitForm />
      <p>{formatRates(sortHabitsByName(filterHabits(habits, "active")), days)}</p>
      <h2>%%listTitle%%</h2>
      <HabitList habits={habits} today={today} />
    </main>
  );
}
