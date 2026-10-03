import { useEffect, useState } from "react";

export default function TaskAdder() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "saving" | "saved" | "failed"

  useEffect(() => {
    fetch("/api/tasks")
      .then((response) => response.json())
      .then(setTasks);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("saving");
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (response.ok) {
      const created = await response.json();
      setTasks((current) => [...current, created]);
      setTitle("");
      setStatus("saved");
    } else {
      setStatus("failed");
    }
  }

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <label htmlFor="task-title">%%titleField%%</label>
        <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <button type="submit">%%add%%</button>
      </form>
      <p role="status">{status === "saved" ? "%%saved%%" : ""}</p>
      <p role="alert">{status === "failed" ? "%%saveFailed%%" : ""}</p>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}
