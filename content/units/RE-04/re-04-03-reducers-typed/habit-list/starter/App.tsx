import { useReducer, useState } from "react";
import type { SubmitEvent } from "react";
import { START_HABITS, nextHabitId } from "./habits";
import { habitsReducer } from "./habitsReducer";

export default function HabitList() {
  const [habits, dispatch] = useReducer(habitsReducer, START_HABITS);
  const [newName, setNewName] = useState("");
  const [renameId, setRenameId] = useState("h-01");
  const [renameText, setRenameText] = useState("");

  function handleAdd(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newName.trim() === "") return;
    dispatch({
      type: "added",
      habit: { id: nextHabitId(), name: newName.trim(), frequency: "daily", active: true, completions: [] },
    });
    setNewName("");
  }

  function handleRename(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (renameText.trim() === "") return;
    dispatch({ type: "updated", id: renameId, name: renameText.trim() });
    setRenameText("");
  }

  return (
    <section>
      <h2>%%heading%%</h2>
      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            <label>
              <input type="checkbox" checked={habit.active} onChange={() => dispatch({ type: "activeToggled", id: habit.id })} />{" "}
              <span>{habit.name}</span>
            </label>{" "}
            <button onClick={() => dispatch({ type: "removed", id: habit.id })}>%%remove%%</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} data-form="add">
        <label>
          %%newHabit%% <input value={newName} onChange={(event) => setNewName(event.target.value)} />
        </label>
        <button type="submit">%%add%%</button>
      </form>
      <form onSubmit={handleRename} data-form="rename">
        <label>
          %%which%%{" "}
          <select value={renameId} onChange={(event) => setRenameId(event.target.value)}>
            {habits.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          %%newName%% <input value={renameText} onChange={(event) => setRenameText(event.target.value)} />
        </label>
        <button type="submit">%%rename%%</button>
      </form>
    </section>
  );
}
