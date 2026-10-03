// The whole page as a tree of components: App → Section → HabitForm and Section → HabitList → one HabitCard per habit.
// The numbers come from the pure domain functions, which stay exactly as they were.
import { formatRates, sortHabitsByName, filterHabits } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";
import { HabitForm } from "./HabitForm.tsx";
import { HabitList } from "./HabitList.tsx";
import { Section } from "./Section.tsx";

type AppProps = { habits: Habit[]; today: string; days: string[] };

export function App({ habits, today, days }: AppProps) {
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/habit.svg" alt="%%imageAlt%%" />
      <Section title="%%formTitle%%">
        <HabitForm />
      </Section>
      <p>{formatRates(sortHabitsByName(filterHabits(habits, "active")), days)}</p>
      <Section title="%%listTitle%%">
        <HabitList habits={habits} today={today} />
      </Section>
    </main>
  );
}
