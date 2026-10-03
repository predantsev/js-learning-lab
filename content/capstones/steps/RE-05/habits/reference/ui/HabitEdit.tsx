// The edit screen: #/habits/:id/edit. Save and Cancel replace this history entry with the habit's own
// page, so Back from there never returns into the finished form.
import { useParams, useNavigate } from "./router.tsx";
import { useHabitsData } from "./useHabits.ts";
import { useHeadingFocus } from "./focus.ts";
import { HabitForm } from "./HabitForm.tsx";
import type { HabitFields } from "./habitsReducer.ts";
import { NotFound } from "./NotFound.tsx";

export function HabitEdit() {
  const { id } = useParams();
  const { habits, dispatch } = useHabitsData();
  const navigate = useNavigate();
  const headingRef = useHeadingFocus("%%editTitle%%");
  const habit = habits.find((one) => one.id === id);
  if (habit === undefined) {
    return <NotFound />;
  }
  const habitId = habit.id;
  const page = "/habits/" + habitId;

  function handleSave(fields: HabitFields) {
    dispatch({ type: "updated", id: habitId, fields: fields });
    // The draft is saved, so this navigation needs no question.
    navigate(page, { replace: true, skipGuard: true });
  }

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%editTitle%%
      </h2>
      {/* key: another habit in the address starts a new form from that habit's data. */}
      <HabitForm key={habit.id} habit={habit} onSave={handleSave} onCancel={() => navigate(page, { replace: true })} />
    </section>
  );
}
