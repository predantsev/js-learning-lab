import { useState } from "react";
import { TASKS } from "./tasks.js";
import { logRender } from "./renders.js";

function TaskForm({ draft, onDraftChange, onAdd }) {
  logRender("TaskForm");
  function handleSubmit(event) {
    event.preventDefault();
    onAdd();
  }
  return (
    <form onSubmit={handleSubmit}>
      <label>
        %%newTask%% <input value={draft} onChange={(event) => onDraftChange(event.target.value)} />
      </label>
      <button type="submit">%%add%%</button>
    </form>
  );
}

function TaskList({ tasks, filter, onFilterChange }) {
  logRender("TaskList");
  const shown = filter === "open" ? tasks.filter((task) => !task.done) : tasks;
  return (
    <section>
      <button aria-pressed={filter === "all"} onClick={() => onFilterChange("all")}>%%all%%</button>
      <button aria-pressed={filter === "open"} onClick={() => onFilterChange("open")}>%%open%%</button>
      <ul>
        {shown.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}

function Summary({ tasks }) {
  logRender("Summary");
  const open = tasks.filter((task) => !task.done).length;
  return <p>%%openCount%% {open}</p>;
}

export default function App() {
  logRender("App");
  const [tasks, setTasks] = useState(TASKS);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");

  function addTask() {
    if (draft.trim() === "") return;
    setTasks([...tasks, { id: `t-${Date.now()}`, title: draft.trim(), done: false }]);
    setDraft("");
  }

  return (
    <main>
      <TaskForm draft={draft} onDraftChange={setDraft} onAdd={addTask} />
      <TaskList tasks={tasks} filter={filter} onFilterChange={setFilter} />
      <Summary tasks={tasks} />
    </main>
  );
}
