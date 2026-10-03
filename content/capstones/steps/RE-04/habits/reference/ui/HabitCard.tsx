// One habit. JSX puts every value in as text, so a name with markup stays text. Every button's
// accessible name also names the habit, so the buttons of different cards are told apart.
import { useEffect, useRef, useState } from "react";
import { frequencyText } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";
import { formatDay, LOCALE } from "./format.js";

type HabitCardProps = {
  habit: Habit;
  today: string;
  onMarkToday: (id: string) => void;
  onToggleActive: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

export function HabitCard({ habit, today, onMarkToday, onToggleActive, onEdit, onRemove }: HabitCardProps) {
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
  // The completions are sorted, so the last one is the latest day (undefined when there is none).
  const lastDone = habit.completions.at(-1);
  const activeText = habit.active ? "%%pauseLabel%%" : "%%resumeLabel%%";
  return (
    <li className="card" data-id={habit.id}>
      <h3>{habit.name}</h3>
      <p>%%valueLabel%%: {frequencyText(habit.frequency)}</p>
      <p>%%completionsLabel%%: {habit.completions.length}</p>
      {lastDone !== undefined && <p>%%lastDoneLabel%%: {formatDay(lastDone, LOCALE)}</p>}
      {habit.completions.includes(today) && <p>%%doneTodayMark%%</p>}
      {!habit.active && <p className="badge">%%pausedMark%%</p>}
      {confirming ? (
        <>
          <p>%%confirmQuestion%%</p>
          <button type="button" aria-label={"%%confirmDeleteLabel%%: " + habit.name} onClick={() => onRemove(habit.id)}>
            %%confirmDeleteLabel%%
          </button>
          <button type="button" ref={cancelRef} aria-label={"%%cancelLabel%%: " + habit.name} onClick={() => showConfirmation(false)}>
            %%cancelLabel%%
          </button>
        </>
      ) : (
        <>
          <button type="button" aria-label={"%%markTodayLabel%%: " + habit.name} onClick={() => onMarkToday(habit.id)}>
            %%markTodayLabel%%
          </button>
          <button type="button" aria-label={activeText + ": " + habit.name} onClick={() => onToggleActive(habit.id)}>
            {activeText}
          </button>
          <button type="button" aria-label={"%%editLabel%%: " + habit.name} onClick={() => onEdit(habit.id)}>
            %%editLabel%%
          </button>
          <button type="button" ref={deleteRef} data-action="delete" aria-label={"%%deleteLabel%%: " + habit.name} onClick={() => showConfirmation(true)}>
            %%deleteLabel%%
          </button>
        </>
      )}
    </li>
  );
}
