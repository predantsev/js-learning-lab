// The edit screen: #/habits/:id/edit. The habit comes from the cached list of all habits. Save waits for
// the API: on success it replaces this history entry with the habit's own page (Back never returns
// into the finished form); on an error the draft stays and the message says why.
import { useState } from "react";
import { useParams, useNavigate } from "./router.tsx";
import { useHabitsList, useHabitMutations } from "./habitsCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";
import { HabitForm } from "./HabitForm.tsx";
import type { HabitFields } from "./habitsReducer.ts";
import { NotFound } from "./NotFound.tsx";

export function HabitEdit() {
  const { id } = useParams();
  const all = useHabitsList("all");
  const mutations = useHabitMutations();
  const navigate = useNavigate();
  const headingRef = useHeadingFocus("%%editTitle%%");
  const [notice, setNotice] = useState("");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  const habit = all.items.find((one) => one.id === id);
  if (habit === undefined) {
    return <NotFound />;
  }
  const habitId = habit.id;
  const page = "/habits/" + habitId;

  async function handleSave(fields: HabitFields): Promise<boolean> {
    const result = await mutations.save(habitId, fields);
    if (!result.ok) {
      setNotice(result.message);
      return false;
    }
    // The draft is saved, so this navigation needs no question.
    navigate(page, { replace: true, skipGuard: true });
    return true;
  }

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%editTitle%%
      </h2>
      <p role="status">{notice}</p>
      {/* key: another habit in the address starts a new form from that habit's data. */}
      <HabitForm key={habit.id} habit={habit} onSave={handleSave} onCancel={() => navigate(page, { replace: true })} />
    </section>
  );
}
