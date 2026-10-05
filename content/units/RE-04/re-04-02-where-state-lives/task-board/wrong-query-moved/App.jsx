import { useState } from "react";
import { TASKS } from "./tasks.js";
import { countRender } from "./renders.js";

function Toolbar({ showDone, onShowDoneChange }) {
  countRender("Toolbar");
  const [query, setQuery] = useState("");
  return (
    <div>
      <label>
        %%search%% <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <label>
        <input type="checkbox" checked={showDone} onChange={(event) => onShowDoneChange(event.target.checked)} /> %%showDone%%
      </label>
    </div>
  );
}

function TaskList({ tasks, query = "", showDone, onToggleDone }) {
  countRender("TaskList");
  // Only the list shows which task is expanded.
  const [expandedId, setExpandedId] = useState(null);
  const needle = query.trim().toLocaleLowerCase();
  const shown = tasks.filter((task) => (showDone || !task.done) && task.title.toLocaleLowerCase().includes(needle));
  return (
    <ul>
      {shown.map((task) => (
        <li key={task.id}>
          <input type="checkbox" aria-label={task.title} checked={task.done} onChange={() => onToggleDone(task.id)} />
          <button aria-expanded={task.id === expandedId} onClick={() => setExpandedId(task.id === expandedId ? null : task.id)}>
            {task.title}
          </button>
          {task.id === expandedId && <p>%%due%% {task.dueDate ?? "%%noDue%%"}</p>}
        </li>
      ))}
    </ul>
  );
}

function Summary({ tasks }) {
  countRender("Summary");
  const open = tasks.filter((task) => !task.done).length;
  return <p>%%openCount%% {open}</p>;
}

function NotePad() {
  countRender("NotePad");
  // Only the note pad reads and changes its draft.
  const [note, setNote] = useState("");
  return (
    <label>
      %%note%% <textarea value={note} onChange={(event) => setNote(event.target.value)} />
    </label>
  );
}

export default function App() {
  countRender("App");
  // Five pieces of state. Which components need each one?
  const [tasks, setTasks] = useState(TASKS);
  const [showDone, setShowDone] = useState(true);

  function toggleDone(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  return (
    <main>
      <Toolbar showDone={showDone} onShowDoneChange={setShowDone} />
      <TaskList tasks={tasks} showDone={showDone} onToggleDone={toggleDone} />
      <Summary tasks={tasks} />
      <NotePad />
    </main>
  );
}
