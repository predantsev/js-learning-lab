import { useEffect, useState } from "react";

async function saveDone(id, done) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ done }),
  });
  return response.ok;
}

export default function TaskChecklist() {
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");
  console.log(`render: ${tasks.map((task) => `${task.id} ${task.done ? "done" : "pending"}`).join(", ")}`);

  useEffect(() => {
    fetch("/api/tasks")
      .then((response) => response.json())
      .then(setTasks);
  }, []);

  async function toggleDone(id) {
    const snapshot = tasks; // the whole list as it was at the click
    const next = !tasks.find((task) => task.id === id).done;
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: next } : task)));
    setMessage("");
    if (!(await saveDone(id, next))) {
      setTasks(snapshot); // roll back: put the whole old list back
      setMessage("%%saveFailed%%");
    }
  }

  return (
    <section>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <label>
              <input type="checkbox" checked={task.done} onChange={() => toggleDone(task.id)} /> {task.title}
            </label>
          </li>
        ))}
      </ul>
      <p role="status">{message}</p>
    </section>
  );
}
