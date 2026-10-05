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


  function toggle(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  return (
    <section>
      <div>
        {FILTERS.map((option) => (
          <button
            key={option.id}
            aria-pressed={filter === option.id}
            onClick={() => {
              setFilter(option.id);
              // Updates the title only when a filter is clicked.
              const count = tasks.filter((task) => option.id === "all" || (option.id === "done") === task.done).length;
              document.title = `%%titlePrefix%% ${count}`;
            }}
          >
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
