// The last 14 days of one habit: #/habits/:id/history. Every day up to the given day (passed in, not
// read from the clock) is a row marked done or missed, newest first, with the current streak.
import { useParams, Link } from "./router.tsx";
import { useHabitsList } from "./habitsCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";
import { formatDay, LOCALE } from "./format.js";
import { NotFound } from "./NotFound.tsx";
import { previousDay, streakOf } from "./streak.ts";

const DAYS = 14;

// Pure: the `count` days that end with `today`, newest first.
export function lastDays(today: string, count: number): string[] {
  const days = [today];
  while (days.length < count) {
    days.push(previousDay(days[days.length - 1]));
  }
  return days;
}

export function HabitHistory({ today }: { today: string }) {
  const { id } = useParams();
  const all = useHabitsList("all");
  const habit = all.items?.find((one) => one.id === id);
  const headingRef = useHeadingFocus(habit === undefined ? "%%notFoundTitle%%" : habit.name + " — %%historyTitle%%");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  if (habit === undefined) {
    return <NotFound />;
  }
  const done = new Set(habit.completions);
  const days = lastDays(today, DAYS);
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        {habit.name} — %%historyTitle%%
      </h2>
      <p>
        %%streakLabel%%: {streakOf(habit.completions, today)} · %%historyDoneLabel%%: {days.filter((day) => done.has(day)).length} / {DAYS}
      </p>
      <ul>
        {days.map((day) => (
          <li key={day}>
            {formatDay(day, LOCALE)} — {done.has(day) ? "%%doneDayMark%%" : "%%missedDayMark%%"}
          </li>
        ))}
      </ul>
      <p>
        <Link to={"/habits/" + habit.id}>%%backToHabitLabel%%</Link>
      </p>
    </section>
  );
}
