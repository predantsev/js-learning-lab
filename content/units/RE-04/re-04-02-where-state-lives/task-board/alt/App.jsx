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
  // Expanded tasks: only the list shows them.
  const [expandedIds, setExpandedIds] = useState([]);
  const needle = query.trim().toLocaleLowerCase();
  const shown = tasks.filter((task) => (showDone || !task.done) && task.title.toLocaleLowerCase().includes(needle));
  return (
    <ul>
      {shown.map((task) => (
        <li key={task.id}>
          <input type="checkbox" aria-label={task.title} checked={task.done} onChange={() => onToggleDone(task.id)} />
          <button
            aria-expanded={expandedIds.includes(task.id)}
            onClick={() => setExpandedIds(expandedIds.includes(task.id) ? expandedIds.filter((id) => id !== task.id) : [...expandedIds, task.id])}
          >
            {task.title}
          </button>
          {expandedIds.includes(task.id) && <p>%%due%% {task.dueDate ?? "%%noDue%%"}</p>}
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
  const [query, setQuery] = useState("");
  const [showDone, setShowDone] = useState(true);

  function toggleDone(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  return (
    <main>
      <Toolbar query={query} onQueryChange={setQuery} showDone={showDone} onShowDoneChange={setShowDone} />
      <TaskList tasks={tasks} query={query} showDone={showDone} onToggleDone={toggleDone} />
      <Summary tasks={tasks} />
      <NotePad />
    </main>
  );
}
