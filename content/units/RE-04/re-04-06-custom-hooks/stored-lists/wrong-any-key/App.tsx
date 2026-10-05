import { useState } from "react";
import type { SubmitEvent } from "react";
import { nextTaskId } from "./storage";
import { useStoredRecords } from "./useStoredRecords";

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

function TaskList({ storageKey, title, list }: { storageKey: string; title: string; list: string }) {
  const [tasks, setTasks] = useStoredRecords(storageKey);
  return (
    <section data-list={list}>
      <h3>{title}</h3>
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
      <TaskList storageKey={WORK_KEY} title="%%work%%" list="work" />
      <TaskList storageKey={HOME_KEY} title="%%home%%" list="home" />
    </main>
  );
}
