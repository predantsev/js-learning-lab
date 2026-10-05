// The edit screen: #/tasks/:id/edit. The task comes from the cached list of all tasks. Save waits for
// the API: on success it replaces this history entry with the task's own page (Back never returns
// into the finished form); on an error the draft stays and the message says why.
import { useState } from "react";
import { useParams, useNavigate } from "./router.tsx";
import { useTasksList, useTaskMutations } from "./tasksCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";
import { TaskForm } from "./TaskForm.tsx";
import type { TaskFields } from "./tasksReducer.ts";
import { NotFound } from "./NotFound.tsx";

export function TaskEdit() {
  const { id } = useParams();
  const all = useTasksList("all");
  const mutations = useTaskMutations();
  const navigate = useNavigate();
  const headingRef = useHeadingFocus("%%editTitle%%");
  const [notice, setNotice] = useState("");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  const task = all.items.find((one) => one.id === id);
  if (task === undefined) {
    return <NotFound />;
  }
  const taskId = task.id;
  const page = "/tasks/" + taskId;

  async function handleSave(fields: TaskFields): Promise<boolean> {
    const result = await mutations.save(taskId, fields);
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
      {/* key: another task in the address starts a new form from that task's data. */}
      <TaskForm key={task.id} task={task} onSave={handleSave} onCancel={() => navigate(page, { replace: true })} />
    </section>
  );
}
