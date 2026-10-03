import { useActionState, useOptimistic, useState } from "react";
import { saveTaskDone } from "./server";

// useActionState, useOptimistic and form actions first shipped in React 19.0.0.
export const REQUIRES_REACT = "19.0.0";

export function TaskToggle({ task }) {
  const [done, setDone] = useState(task.done);
  const [shownDone, setShownDone] = useOptimistic(done);
  const [error, toggleAction, isPending] = useActionState(async (previous, formData) => {
    const next = formData.get("next") === "true";
    setShownDone(next);
    try {
      setDone(await saveTaskDone(task.id, next));
      return null;
    } catch {
      return "%%saveFailed%%";
    }
  }, null);

  return (
    <form action={toggleAction}>
      <input type="hidden" name="next" value={String(!shownDone)} />
      <button aria-pressed={shownDone}>
        {task.title}: {shownDone ? "%%done%%" : "%%pending%%"}
      </button>
      {isPending && <span> %%saving%%</span>}
      {error !== null && <p role="alert">{error}</p>}
    </form>
  );
}
