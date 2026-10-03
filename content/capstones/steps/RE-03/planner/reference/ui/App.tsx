// The whole page as a tree of components: App → Section → TaskForm and Section → TaskList → one
// TaskCard per task. App owns the list, the task being edited and the filter; every change is a new
// list computed by the pure domain functions, which stay exactly as they were.
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { countDueTasks, filterTasks, addTask, updateTask, removeTask } from "../domain/tasks.ts";
import type { Task, TaskStatus } from "../domain/tasks.ts";
import { formatDay, LOCALE } from "./format.js";
import { TaskForm } from "./TaskForm.tsx";
import type { TaskFields } from "./TaskForm.tsx";
import { TaskList } from "./TaskList.tsx";
import { Section } from "./Section.tsx";
import { loadTasks, saveTasks } from "../storage/tasks.ts";

type Filter = "all" | TaskStatus;

// An id that no task of the list has yet (saved tasks may already use "t-7").
function newId(list: Task[]): string {
  let number = list.length + 1;
  while (list.some((task) => task.id === "t-" + number)) {
    number += 1;
  }
  return "t-" + number;
}

type AppProps = { startingTasks: Task[]; today: string };

export function App({ startingTasks, today }: AppProps) {
  // Read once: a function given to useState runs only on the first render. loadTasks checks every
  // saved record; without usable saved tasks the list starts from the starting ones.
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = loadTasks(localStorage);
    return saved.ok ? saved.tasks : startingTasks;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  // Keeps localStorage in step with the list: after every commit in which `tasks` changed, the
  // whole list is written as { schemaVersion: 1, records }, replacing what was stored. Writing the
  // same list again changes nothing, so StrictMode's second run in development is harmless; a write
  // switches nothing on, so the effect needs no cleanup.
  useEffect(() => {
    saveTasks(localStorage, tasks);
  }, [tasks]);

  // Computed during render from the same state, never stored: they cannot fall out of step.
  const editing = tasks.find((task) => task.id === editingId) ?? null;
  const shown = filter === "all" ? tasks : filterTasks(tasks, filter);

  function handleSave(fields: TaskFields) {
    if (editingId === null) {
      setTasks((previous) => addTask(previous, newId(previous), fields));
    } else {
      const id = editingId;
      setTasks((previous) => updateTask(previous, id, fields));
      setEditingId(null);
    }
  }

  function handleToggle(id: string) {
    setTasks((previous) => {
      const task = previous.find((one) => one.id === id);
      return task === undefined ? previous : updateTask(previous, id, { done: !task.done });
    });
  }

  function handleRemove(id: string) {
    setTasks((previous) => removeTask(previous, id));
    if (editingId === id) {
      setEditingId(null);
    }
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || value === "pending" || value === "done") {
      setFilter(value);
    }
  }

  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/task.svg" alt="%%imageAlt%%" />
      <Section title="%%formTitle%%">
        {/* A new key gives a new form: picking another task starts the form from that task's data. */}
        <TaskForm key={editingId ?? "new"} task={editing} onSave={handleSave} onCancel={() => setEditingId(null)} />
      </Section>
      <p>
        %%dueSummary%% {formatDay(today, LOCALE)}: {countDueTasks(tasks, today)}
      </p>
      <Section title="%%listTitle%%">
        <div className="field">
          <label htmlFor="list-filter">%%filterLabel%%</label>
          <select id="list-filter" value={filter} onChange={handleFilter}>
            <option value="all">%%filterAll%%</option>
            <option value="pending">%%filterPending%%</option>
            <option value="done">%%filterDone%%</option>
          </select>
        </div>
        <TaskList tasks={shown} emptyText={tasks.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onToggle={handleToggle} onEdit={setEditingId} onRemove={handleRemove} />
      </Section>
    </main>
  );
}
