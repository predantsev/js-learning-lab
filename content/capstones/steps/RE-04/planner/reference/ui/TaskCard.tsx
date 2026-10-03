// One task. JSX puts every value in as text, so a title with markup stays text. Every button's
// accessible name also names the task, so the buttons of different cards are told apart.
import { useEffect, useRef, useState } from "react";
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
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  // The button that had focus disappears when the card switches between its two sets of buttons, so
  // focus moves to the matching button of the new set. The first commit moves nothing.
  const switched = useRef(false);
  useEffect(() => {
    if (!switched.current) {
      return;
    }
    switched.current = false;
    (confirming ? cancelRef : deleteRef).current?.focus();
  }, [confirming]);

  function showConfirmation(value: boolean) {
    switched.current = true;
    setConfirming(value);
  }
  const toggleText = task.done ? "%%markPendingLabel%%" : "%%markDoneLabel%%";
  return (
    <li className="card" data-id={task.id}>
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
          <button type="button" ref={cancelRef} aria-label={"%%cancelLabel%%: " + task.title} onClick={() => showConfirmation(false)}>
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
          <button type="button" ref={deleteRef} data-action="delete" aria-label={"%%deleteLabel%%: " + task.title} onClick={() => showConfirmation(true)}>
            %%deleteLabel%%
          </button>
        </>
      )}
    </li>
  );
}
