import { useEffect, useRef, useState } from "react";
import "./styles.css";

const HABITS = [
  { id: "h-01", name: "%%exercise%%" },
  { id: "h-02", name: "%%reading%%" },
  { id: "h-03", name: "%%water%%" },
];

function HabitRow({ habit, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(habit.name);
  const renameRef = useRef(null);

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

  function handleKeyDown(event) {
    if (event.key === "Escape") cancel();
  }


  if (editing) {
    return (
      <li>
        <form onSubmit={save}>
          <label>
            %%newName%%{" "}
            <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} />
          </label>{" "}
          <button type="submit">%%save%%</button>{" "}
          <button type="button" onClick={cancel}>
            %%cancel%%
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <span>{habit.name}</span>
      <button ref={renameRef} type="button" className="link" onClick={open}>
        %%rename%%
      </button>
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
