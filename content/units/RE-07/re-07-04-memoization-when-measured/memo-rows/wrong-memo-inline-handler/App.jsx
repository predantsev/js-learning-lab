import { memo, useCallback, useState } from "react";
import { TASKS } from "./tasks";
import { TaskRow } from "./TaskRow";

// Measured: one toggle rendered all 2,000 rows. A row now renders only when its props change.
const MemoTaskRow = memo(TaskRow);

export default function TaskBoard() {
  const [tasks, setTasks] = useState(TASKS);
  const [draft, setDraft] = useState("");

  function toggle(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function add(event) {
    event.preventDefault();
    const title = draft.trim();
    if (title === "") return;
    setTasks([...tasks, { id: `t-${tasks.length + 1}`, title, done: false }]);
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
