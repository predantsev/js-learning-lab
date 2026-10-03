// The edit screen: #/tasks/:id/edit. Save and Cancel replace this history entry with the task's own
// page, so Back from there never returns into the finished form.
import { useParams, useNavigate } from "./router.tsx";
import { useTasksData } from "./useTasks.ts";
import { useHeadingFocus } from "./focus.ts";
import { TaskForm } from "./TaskForm.tsx";
import type { TaskFields } from "./tasksReducer.ts";
import { NotFound } from "./NotFound.tsx";

export function TaskEdit() {
  const { id } = useParams();
  const { tasks, dispatch } = useTasksData();
  const navigate = useNavigate();
  const headingRef = useHeadingFocus("%%editTitle%%");
  const task = tasks.find((one) => one.id === id);
  if (task === undefined) {
    return <NotFound />;
  }
  const taskId = task.id;
  const page = "/tasks/" + taskId;

  function handleSave(fields: TaskFields) {
    dispatch({ type: "updated", id: taskId, fields: fields });
    // The draft is saved, so this navigation needs no question.
    navigate(page, { replace: true, skipGuard: true });
  }

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%editTitle%%
      </h2>
      {/* key: another task in the address starts a new form from that task's data. */}
      <TaskForm key={task.id} task={task} onSave={handleSave} onCancel={() => navigate(page, { replace: true })} />
    </section>
  );
}
