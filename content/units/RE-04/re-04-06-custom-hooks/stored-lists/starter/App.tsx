import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { nextTaskId, readRecords } from "./storage";
import type { StoredTask } from "./storage";

export const WORK_KEY = "jsll.lab.work";
export const HOME_KEY = "jsll.lab.home";

function AddTask({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState("");
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim() === "") return;
    onAdd(title.trim());
    setTitle("");
  }
  return (
    <form onSubmit={handleSubmit}>
      <label>
        %%newTask%% <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <button type="submit">%%add%%</button>
    </form>
  );
}

// Remembers its tasks: reads them once, stores every change, and reloads them
// when another tab changes the same key.
function WorkList() {
  const [tasks, setTasks] = useState<StoredTask[]>(() => readRecords(WORK_KEY));

  useEffect(() => {
    localStorage.setItem(WORK_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === WORK_KEY) setTasks(readRecords(WORK_KEY));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <section data-list="work">
      <h3>%%work%%</h3>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
      <AddTask onAdd={(title) => setTasks([...tasks, { id: nextTaskId(), title: title }])} />
    </section>
  );
}

// Forgets everything on every run: it should remember its tasks the same way, under HOME_KEY.
function HomeList() {
  const [tasks, setTasks] = useState<StoredTask[]>([]);

  return (
    <section data-list="home">
      <h3>%%home%%</h3>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
      <AddTask onAdd={(title) => setTasks([...tasks, { id: nextTaskId(), title: title }])} />
    </section>
  );
}

export default function Planner() {
  return (
    <main>
      <WorkList />
      <HomeList />
    </main>
  );
}
