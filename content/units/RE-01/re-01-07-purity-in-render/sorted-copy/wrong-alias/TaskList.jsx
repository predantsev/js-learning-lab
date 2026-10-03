import { compareByDueDate } from "./tasks.js";

// A new name is not a new array: `copy` points to the same array as `tasks`.
export function TaskList({ tasks }) {
  const copy = tasks;
  copy.sort(compareByDueDate);
  return (
    <ol data-list="by-due">
      {copy.map((task) => (
        <li key={task.id}>{task.title} · {task.dueDate ?? "%%noDue%%"}</li>
      ))}
    </ol>
  );
}
