import { useState } from "react";
import { createQueryCache } from "./queryCache.js";
import { useQuery } from "./useQuery.js";

async function getJson(path, signal) {
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Query functions: the key says what to read.
const fetchTasks = ([, filter], signal) => getJson(`/api/tasks?filter=${filter}`, signal);
const fetchDueCount = (key, signal) => getJson("/api/tasks/due-count", signal);
const fetchSettings = (key, signal) => getJson("/api/settings", signal);

async function send(method, path, body) {
  const response = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return response.ok;
}

export default function Planner() {
  const [cache] = useState(createQueryCache);
  const [filter, setFilter] = useState("all");
  const [title, setTitle] = useState("");
  const settings = useQuery(cache, ["settings"], fetchSettings);
  const dueCount = useQuery(cache, ["tasks", "due-count"], fetchDueCount);
  const tasks = useQuery(cache, ["tasks", filter], fetchTasks);

  async function addTask(event) {
    event.preventDefault();
    if (await send("POST", "/api/tasks", { title })) {
      setTitle("");
      cache.invalidate([]); // "clearing everything is the safe choice"
    }
  }

  async function markDone(id) {
    if (await send("PATCH", `/api/tasks/${id}`, { done: true })) {
      cache.invalidate([]); // "clearing everything is the safe choice"
    }
  }

  async function removeTask(id) {
    if (await send("DELETE", `/api/tasks/${id}`)) {
      cache.invalidate([]); // "clearing everything is the safe choice"
    }
  }

  return (
    <main>
      <h1>{settings.loading ? "…" : settings.data.listName}</h1>
      <p>
        %%dueToday%% <output>{dueCount.loading ? "…" : dueCount.data.count}</output>
      </p>
      <p>
        {["all", "pending", "done"].map((option) => (
          <button key={option} aria-pressed={filter === option} onClick={() => setFilter(option)}>
            {option === "all" ? "%%all%%" : option === "pending" ? "%%pending%%" : "%%done%%"}
          </button>
        ))}
      </p>
      {tasks.loading ? (
        <p role="status">%%loading%%</p>
      ) : (
        <ul>
          {tasks.data.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span>
              {!task.done && <button onClick={() => markDone(task.id)}>%%markDone%%</button>}
              <button onClick={() => removeTask(task.id)}>%%remove%%</button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={addTask}>
        <label htmlFor="task-title">%%titleField%%</label>
        <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <button type="submit">%%add%%</button>
      </form>
    </main>
  );
}
