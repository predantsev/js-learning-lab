import { useActionState, useState } from "react";
import { saveTaskDone } from "./server";

// TODO: the minimum React version this file needs, as text such as "17.0.0".
export const REQUIRES_REACT = "";

// TODO: show the new status at once (useOptimistic); when the save is refused,
// show the old status again and announce "%%saveFailed%%" with role="alert".
export function TaskToggle({ task }) {
  const [done, setDone] = useState(task.done);
  const [, toggleAction, isPending] = useActionState(async (previous, formData) => {
    const next = formData.get("next") === "true";
    try {
      setDone(await saveTaskDone(task.id, next));
    } catch {
      // the refusal is ignored for now
    }
    return null;
  }, null);

  return (
    <form action={toggleAction}>
      <input type="hidden" name="next" value={String(!done)} />
      <button aria-pressed={done}>
        {task.title}: {done ? "%%done%%" : "%%pending%%"}
      </button>
      {isPending && <span> %%saving%%</span>}
    </form>
  );
}
