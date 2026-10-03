// One task. JSX puts every value in as text, so a title with markup stays text. Every button's
// accessible name also names the task, so the buttons of different cards are told apart.
import { useState } from "react";
import { priorityText } from "../domain/tasks.ts";
import type { Task } from "../domain/tasks.ts";
import { formatDay, LOCALE } from "./format.js";

type TaskCardProps = {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

export function TaskCard({ task, onToggle, onEdit, onRemove }: TaskCardProps) {
  // Only this card needs to know that its delete waits for a confirmation, so the state lives here.
  const [confirming, setConfirming] = useState(false);
  const toggleText = task.done ? "%%markPendingLabel%%" : "%%markDoneLabel%%";
  return (
    <li className="card">
      <h3>{task.title}</h3>
      <p>%%valueLabel%%: {task.dueDate === null ? "%%noDueDate%%" : formatDay(task.dueDate, LOCALE)}</p>
      <p>%%priorityFieldLabel%%: {priorityText(task.priority)}</p>
      {task.done && <p className="badge">%%doneMark%%</p>}
      {confirming ? (
        <>
          <p>%%confirmQuestion%%</p>
          <button type="button" aria-label={"%%confirmDeleteLabel%%: " + task.title} onClick={() => onRemove(task.id)}>
            %%confirmDeleteLabel%%
          </button>
          <button type="button" aria-label={"%%cancelLabel%%: " + task.title} onClick={() => setConfirming(false)}>
            %%cancelLabel%%
          </button>
        </>
      ) : (
        <>
          <button type="button" aria-label={toggleText + ": " + task.title} onClick={() => onToggle(task.id)}>
            {toggleText}
          </button>
          <button type="button" aria-label={"%%editLabel%%: " + task.title} onClick={() => onEdit(task.id)}>
            %%editLabel%%
          </button>
          <button type="button" aria-label={"%%deleteLabel%%: " + task.title} onClick={() => setConfirming(true)}>
            %%deleteLabel%%
          </button>
        </>
      )}
    </li>
  );
}
