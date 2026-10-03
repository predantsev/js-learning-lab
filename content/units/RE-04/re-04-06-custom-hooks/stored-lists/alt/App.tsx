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

function WorkList() {
  const [tasks, setTasks] = useStoredRecords(WORK_KEY);
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

function HomeList() {
  const [tasks, setTasks] = useStoredRecords(HOME_KEY);
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
