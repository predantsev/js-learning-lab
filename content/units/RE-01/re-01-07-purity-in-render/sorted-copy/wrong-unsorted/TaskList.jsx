import { compareByDueDate } from "./tasks.js";

// The copy is made, but never sorted.
export function TaskList({ tasks }) {
  const sorted = [...tasks];
  return (
    <ol data-list="by-due">
      {sorted.map((task) => (
        <li key={task.id}>{task.title} · {task.dueDate ?? "%%noDue%%"}</li>
      ))}
    </ol>
  );
}
