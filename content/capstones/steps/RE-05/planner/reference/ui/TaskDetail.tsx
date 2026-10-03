// One task: #/tasks/:id. The id from the address is only text: it is looked up in the list, and an
// id that no task has shows the not-found screen.
import { useParams, Link } from "./router.tsx";
import { useTasksData } from "./useTasks.ts";
import { useHeadingFocus } from "./focus.ts";
import { priorityText } from "../domain/tasks.ts";
import { formatDay, LOCALE } from "./format.js";
import { NotFound } from "./NotFound.tsx";

export function TaskDetail() {
  const { id } = useParams();
  const { tasks } = useTasksData();
  const task = tasks.find((one) => one.id === id);
  const headingRef = useHeadingFocus(task?.title ?? "%%notFoundTitle%%");
  if (task === undefined) {
    return <NotFound />;
  }
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        {task.title}
      </h2>
      <p>%%valueLabel%%: {task.dueDate === null ? "%%noDueDate%%" : formatDay(task.dueDate, LOCALE)}</p>
      <p>%%priorityFieldLabel%%: {priorityText(task.priority)}</p>
      <p>{task.done ? "%%doneMark%%" : "%%pendingMark%%"}</p>
      <p>
        <Link to={"/tasks/" + task.id + "/edit"}>%%editLabel%%</Link> · <Link to="/tasks">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
