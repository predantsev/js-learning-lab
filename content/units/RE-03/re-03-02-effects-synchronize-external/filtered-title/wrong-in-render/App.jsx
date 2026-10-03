import { useState } from "react";
import { TASKS } from "./tasks.js";

const FILTERS = [
  { id: "all", label: "%%all%%" },
  { id: "pending", label: "%%pending%%" },
  { id: "done", label: "%%done%%" },
];

export default function TaskList() {
  const [tasks, setTasks] = useState(TASKS);
  const [filter, setFilter] = useState("all");

  const visible = tasks.filter((task) => filter === "all" || (filter === "done") === task.done);

  // Assigned during render: the screen still shows the previous render.
  document.title = `%%titlePrefix%% ${visible.length}`;

  function toggle(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  return (
    <section>
      <div>
        {FILTERS.map((option) => (
          <button key={option.id} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
            {option.label}
          </button>
        ))}
      </div>
      <p>%%titlePrefix%% {visible.length}</p>
      <ul>
        {visible.map((task) => (
          <li key={task.id}>
            <label>
              <input type="checkbox" checked={task.done} onChange={() => toggle(task.id)} /> {task.title}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
