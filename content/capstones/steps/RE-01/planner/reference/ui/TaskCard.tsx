// One task. JSX puts every value in as text, so a title with markup stays text.
import { priorityText } from "../domain/tasks.ts";
import type { Task } from "../domain/tasks.ts";
import { formatDay, LOCALE } from "./format.js";

type TaskCardProps = { task: Task };

export function TaskCard({ task }: TaskCardProps) {
  return (
    <li className="card">
      <h3>{task.title}</h3>
      <p>%%valueLabel%%: {task.dueDate === null ? "%%noDueDate%%" : formatDay(task.dueDate, LOCALE)}</p>
      <p>%%priorityFieldLabel%%: {priorityText(task.priority)}</p>
      {task.done && <p className="badge">%%doneMark%%</p>}
    </li>
  );
}
