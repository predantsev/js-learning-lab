import { memo, useCallback, useReducer, useState } from "react";
import { TASKS } from "./tasks";
import { TaskRow } from "./TaskRow";

const MemoTaskRow = memo(TaskRow);

function tasksReducer(tasks, action) {
  switch (action.type) {
    case "toggled":
      return tasks.map((task) => (task.id === action.id ? { ...task, done: !task.done } : task));
    case "added":
      return [...tasks, { id: `t-${tasks.length + 1}`, title: action.title, done: false }];
    default:
      return tasks;
  }
}

export default function TaskBoard() {
  const [tasks, dispatch] = useReducer(tasksReducer, TASKS);
  const [draft, setDraft] = useState("");

  // dispatch is stable, so this callback never needs to change.
  const toggle = useCallback((id) => dispatch({ type: "toggled", id }), []);

  function add(event) {
    event.preventDefault();
    const title = draft.trim();
    if (title === "") return;
    dispatch({ type: "added", title });
    setDraft("");
  }

  return (
    <section>
      <form onSubmit={add}>
        <label>
          %%newTask%% <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>{" "}
        <button type="submit">%%add%%</button>
      </form>
      <ul>
        {tasks.map((task) => (
          <MemoTaskRow key={task.id} task={task} onToggle={toggle} />
        ))}
      </ul>
    </section>
  );
}
