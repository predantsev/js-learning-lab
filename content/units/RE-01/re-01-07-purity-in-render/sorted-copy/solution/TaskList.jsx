import { compareByDueDate } from "./tasks.js";

export function TaskList({ tasks }) {
  const sorted = tasks.toSorted(compareByDueDate);
  return (
    <ol data-list="by-due">
      {sorted.map((task) => (
        <li key={task.id}>{task.title} · {task.dueDate ?? "%%noDue%%"}</li>
      ))}
    </ol>
  );
}
