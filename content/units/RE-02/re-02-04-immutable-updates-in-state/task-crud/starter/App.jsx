import { useState } from "react";
import { tasks as startTasks, createTask } from "./tasks.js";

export default function TaskList() {
  const [tasks, setTasks] = useState(startTasks);

  function handleAdd() {
    const task = createTask("%%newTitle%%");
    // TODO: put `task` at the end of the list
  }

  function handleToggle(id) {
    // TODO: flip `done` of the task with this id
  }

  function handleRemove(id) {
    // TODO: take the task with this id out of the list
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
