import { useState } from "react";
import { tasks as startTasks, createTask } from "./tasks.js";

export default function TaskList() {
  const [tasks, setTasks] = useState(startTasks);

  function handleAdd() {
    const task = createTask("%%newTitle%%");
    setTasks([...tasks, task]);
  }

  function handleToggle(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function handleRemove(id) {
    setTasks(tasks.filter((task) => task.id === id));
  }

  return (
    <section>
      <h1>%%planner%%</h1>
      <button onClick={handleAdd}>%%add%%</button>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <span className="title">{task.title}</span> ·{" "}
            <span className="priority">{task.priority}</span> ·{" "}
            <span className="status">{task.done ? "%%done%%" : "%%pending%%"}</span>{" "}
            <button onClick={() => handleToggle(task.id)}>%%toggle%%</button>{" "}
            <button onClick={() => handleRemove(task.id)}>%%remove%%</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
