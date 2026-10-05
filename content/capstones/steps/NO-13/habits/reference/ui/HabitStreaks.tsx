// Completion rates and streaks: #/habits/summary. This module is not in dist/app.js: SummaryRoute.tsx
// loads it with React.lazy when the route opens, and esbuild (--splitting) writes it to its own file.
// The day is passed in (today, days), so the screen shows the same on every computer and in the tests.
import { sortHabitsByName, summarizeHabit } from "../domain/habits.ts";
import { streakOf } from "./streak.ts";
import { Link } from "./router.tsx";
import { useHabitsList } from "./habitsCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";

export default function HabitStreaks({ today, days }: { today: string; days: string[] }) {
  const all = useHabitsList("all");
  const headingRef = useHeadingFocus("%%summaryTitle%%");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%summaryTitle%%
      </h2>
      <ul>
        {sortHabitsByName(all.items).map((habit) => (
          <li key={habit.id}>
            <Link to={"/habits/" + habit.id}>{habit.name}</Link> — %%rateLabel%%: {Math.round(summarizeHabit(habit, days).rate * 100)}% · %%streakLabel%%: {streakOf(habit.completions, today)}
          </li>
        ))}
      </ul>
      <p>
        <Link to="/habits">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
