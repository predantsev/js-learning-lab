import { useState } from "react";
import { TASKS } from "./tasks.js";
import { countRender } from "./renders.js";

function Toolbar({ query, onQueryChange, showDone, onShowDoneChange }) {
  countRender("Toolbar");
  return (
    <div>
      <label>
        %%search%% <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} />
      </label>
      <label>
        <input type="checkbox" checked={showDone} onChange={(event) => onShowDoneChange(event.target.checked)} /> %%showDone%%
      </label>
    </div>
  );
}

function TaskList({ tasks, query, showDone, onToggleDone }) {
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

function NotePad({ note, onNoteChange }) {
  countRender("NotePad");
  return (
    <label>
      %%note%% <textarea value={note} onChange={(event) => onNoteChange(event.target.value)} />
    </label>
  );
}

export default function App() {
  countRender("App");
  // Five pieces of state. Which components need each one?
  const [tasks, setTasks] = useState(TASKS);
  const [query, setQuery] = useState("");
  const [showDone, setShowDone] = useState(true);
  const [note, setNote] = useState("");

  function toggleDone(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  return (
    <main>
      <Toolbar query={query} onQueryChange={setQuery} showDone={showDone} onShowDoneChange={setShowDone} />
      <TaskList tasks={tasks} query={query} showDone={showDone} onToggleDone={toggleDone} />
      <Summary tasks={tasks} />
      <NotePad note={note} onNoteChange={setNote} />
    </main>
  );
}
