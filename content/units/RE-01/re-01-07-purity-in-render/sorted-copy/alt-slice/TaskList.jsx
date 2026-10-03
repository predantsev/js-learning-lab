import { compareByDueDate } from "./tasks.js";

export function TaskList({ tasks }) {
  return (
    <ol data-list="by-due">
      {tasks
        .slice()
        .sort(compareByDueDate)
        .map((task) => (
          <li key={task.id}>{task.title} · {task.dueDate ?? "%%noDue%%"}</li>
        ))}
    </ol>
  );
}
