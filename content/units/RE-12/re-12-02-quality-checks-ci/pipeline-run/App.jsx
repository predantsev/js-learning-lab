import { useState } from "react";

// release-lab's App without types, lazy loading or saving: the part the test stage checks.
const START = [
  { id: "t-1", title: "%%rent%%", done: false },
  { id: "t-2", title: "%%bank%%", done: true },
];

export default function App() {
  const [tasks, setTasks] = useState(START);
  const [title, setTitle] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (title.trim() === "") return;
    setTasks((current) => [...current, { id: `t-${current.length + 1}`, title: title.trim(), done: false }]);
    setTitle("");
  }

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <label htmlFor="task-title">%%newTask%%</label>
        <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <button type="submit">%%add%%</button>
      </form>
      <ul aria-label="%%tasksList%%">
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </main>
  );
}
