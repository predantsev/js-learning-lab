import { useEffect, useState } from "react";
import { listTasks } from "./fixtureApi.js";

const FILTERS = [
  { id: "all", label: "%%all%%" },
  { id: "pending", label: "%%pending%%" },
  { id: "done", label: "%%done%%" },
];

export default function TaskList() {
  const [filter, setFilter] = useState("done");
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    listTasks(filter).then((data) => {
      console.log(`setTasks: the answer for "${filter}"`);
      setTasks(data);
    });
  }, [filter]);

  return (
    <section>
      {FILTERS.map((option) => (
        <button key={option.id} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
          {option.label}
        </button>
      ))}
      <p>%%shown%% {tasks.length}</p>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}
