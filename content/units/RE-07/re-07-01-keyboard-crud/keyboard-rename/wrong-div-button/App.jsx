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
  // Remembers whether the previous commit showed the editor. A ref: no render needs it.
  const wasEditing = useRef(false);

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

  // After the commit that closes the editor, the Rename button exists again.
  useEffect(() => {
    if (!editing && wasEditing.current) renameRef.current.focus();
    wasEditing.current = editing;
  }, [editing]);

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
      <div ref={renameRef} role="button" tabIndex={0} className="link" onClick={open}>
        %%rename%%
      </div>
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
