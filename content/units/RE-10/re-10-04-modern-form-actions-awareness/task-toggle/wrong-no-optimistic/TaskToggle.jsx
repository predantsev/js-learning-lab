import { useActionState, useState } from "react";
import { saveTaskDone } from "./server";

export const REQUIRES_REACT = "19.0.0";

export function TaskToggle({ task }) {
  const [done, setDone] = useState(task.done);
  const [error, toggleAction, isPending] = useActionState(async (previous, formData) => {
    const next = formData.get("next") === "true";
    try {
      setDone(await saveTaskDone(task.id, next));
    } catch {
      return "%%saveFailed%%";
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
      {error !== null && <p role="alert">{error}</p>}
    </form>
  );
}
