import { useState } from "react";
import "./styles.css";

const HABITS = [
  { id: "h-01", name: "%%exercise%%" },
  { id: "h-02", name: "%%reading%%" },
  { id: "h-03", name: "%%water%%" },
];

function HabitRow({ habit, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(habit.name);

  function open() {
    setDraft(habit.name);
    setEditing(true);
  }

  function save(event) {
    event.preventDefault();
    if (draft.trim() === "") return;
    onRename(habit.id, draft.trim());
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  if (editing) {
    return (
      <li>
        <form onSubmit={save}>
          <label>
            %%newName%% <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} />
          </label>{" "}
          <button type="submit">%%save%%</button>{" "}
          <button type="button" onClick={cancel}>
            %%cancel%%
          </button>
        </form>
      </li>
    );
  }

  // TODO: make Rename work from the keyboard, cancel on Escape,
  // and return focus to this row's Rename after saving or canceling.
  return (
    <li>
      <span>{habit.name}</span>
      <span className="link" onClick={open}>
        %%rename%%
      </span>
    </li>
  );
}

export default function HabitList() {
  const [habits, setHabits] = useState(HABITS);

  function rename(id, name) {
    setHabits(habits.map((habit) => (habit.id === id ? { ...habit, name: name } : habit)));
  }

  return (
    <section>
      <h2>%%heading%%</h2>
      <ul>
        {habits.map((habit) => (
          <HabitRow key={habit.id} habit={habit} onRename={rename} />
        ))}
      </ul>
    </section>
  );
}
