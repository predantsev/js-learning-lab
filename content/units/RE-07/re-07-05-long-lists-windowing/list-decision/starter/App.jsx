import { useState } from "react";
import { makeTasks } from "./tasks";

const SIZES = [300, 5000];

function TaskList({ tasks }) {
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <label>
            <input type="checkbox" defaultChecked={task.done} /> {task.title}
          </label>
        </li>
      ))}
    </ul>
  );
}

export default function TaskPage() {
  const [size, setSize] = useState(SIZES[0]);
  const tasks = makeTasks(size);

  return (
    <main>
      <p>
        %%showing%%{" "}
        {SIZES.map((option) => (
          <button key={option} aria-pressed={size === option} onClick={() => setSize(option)}>
            {option}
          </button>
        ))}
      </p>
      <TaskList tasks={tasks} />
    </main>
  );
}
