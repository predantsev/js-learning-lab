// One habit: #/habits/:id. The id from the address is only text: it is looked up in the cached list of
// all habits (one source for every screen, read again when this screen opens), and an id that no
// habit has shows the not-found screen. A habit without completions shows an empty state instead
// of an empty list.
import { useParams, Link } from "./router.tsx";
import { useHabitsList } from "./habitsCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";
import { frequencyText } from "../domain/habits.ts";
import { formatDay, LOCALE } from "./format.js";
import { NotFound } from "./NotFound.tsx";

export function HabitDetail({ today }: { today: string }) {
  const { id } = useParams();
  const all = useHabitsList("all");
  const habit = all.items?.find((one) => one.id === id);
  const headingRef = useHeadingFocus(habit?.name ?? "%%notFoundTitle%%");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  if (habit === undefined) {
    return <NotFound />;
  }
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        {habit.name}
      </h2>
      <p>%%valueLabel%%: {frequencyText(habit.frequency)}</p>
      <p>{habit.active ? "%%activeFieldLabel%%" : "%%pausedMark%%"}</p>
      <h3>%%completionsLabel%%</h3>
      {habit.completions.length === 0 ? (
        <p>%%noCompletionsMessage%%</p>
      ) : (
        <ul>
          {habit.completions.map((day) => (
            <li key={day}>
              {formatDay(day, LOCALE)}
              {day === today && " · %%doneTodayMark%%"}
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link to={"/habits/" + habit.id + "/edit"}>%%editLabel%%</Link> · <Link to="/habits">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
