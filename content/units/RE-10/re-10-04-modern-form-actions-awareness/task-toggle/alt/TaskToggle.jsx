import { useActionState, useOptimistic, useState } from "react";
import { saveTaskDone } from "./server";

// Form actions, useActionState and useOptimistic: React 19 and newer.
export const REQUIRES_REACT = "19";

export function TaskToggle({ task }) {
  const [done, setDone] = useState(task.done);
  const [shownDone, showDone] = useOptimistic(done, (current, next) => next);
  const [message, toggleAction, isPending] = useActionState(async (previous, formData) => {
    const next = formData.get("next") === "true";
    showDone(next);
    let saved;
    try {
      saved = await saveTaskDone(task.id, next);
    } catch {
      return "%%saveFailed%%";
    }
    setDone(saved);
    return null;
  }, null);

  return (
    <form action={toggleAction}>
      <input type="hidden" name="next" value={String(!shownDone)} />
      <button aria-pressed={shownDone}>
        {task.title}: {shownDone ? "%%done%%" : "%%pending%%"}
      </button>
      {isPending ? <span> %%saving%%</span> : null}
      {message && (
        <p role="alert" style={{ color: "firebrick" }}>
          {message}
        </p>
      )}
    </form>
  );
}
