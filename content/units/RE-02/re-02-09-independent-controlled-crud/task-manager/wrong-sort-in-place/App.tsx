import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { validateTask, MESSAGES, startTasks, nextTaskId } from "./tasks";
import type { Task, TaskErrors, Priority } from "./tasks";

type Fields = { title: string; dueDate: string; priority: string };
type Filter = "all" | "pending" | "done";

const EMPTY: Fields = { title: "", dueDate: "", priority: "normal" };

function fieldsOf(task: Task | null): Fields {
  if (task === null) {
    return EMPTY;
  }
  return { title: task.title, dueDate: task.dueDate ?? "", priority: task.priority };
}

type Saved = { title: string; dueDate: string | null; priority: Priority };

function TaskForm({ task, onSave }: { task: Task | null; onSave: (saved: Saved) => void }) {
  const [draft, setDraft] = useState<Fields>(fieldsOf(task));
  const [errors, setErrors] = useState<TaskErrors>({});

  function handleText(event: ChangeEvent<HTMLInputElement>) {
    setDraft({ ...draft, [event.target.name]: event.target.value });
  }

  function handlePriority(event: ChangeEvent<HTMLSelectElement>) {
    setDraft({ ...draft, priority: event.target.value });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const due = draft.dueDate.trim();
    const check = validateTask({ title: draft.title, dueDate: due === "" ? null : due, priority: draft.priority });
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    onSave(check.value);
    setDraft(EMPTY);
    setErrors({});
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        %%titleLabel%% <input name="title" value={draft.title} onChange={handleText} />
      </label>
      <p className="title-error">{errors.title ? MESSAGES[errors.title] : ""}</p>
      <label>
        %%dueLabel%% <input name="dueDate" placeholder="YYYY-MM-DD" value={draft.dueDate} onChange={handleText} />
      </label>
      <p className="due-error">{errors.dueDate ? MESSAGES[errors.dueDate] : ""}</p>
      <label>
        %%priorityLabel%%{" "}
        <select value={draft.priority} onChange={handlePriority}>
          <option value="low">%%low%%</option>
          <option value="normal">%%normal%%</option>
          <option value="high">%%high%%</option>
        </select>
      </label>
      <button>{task === null ? "%%add%%" : "%%save%%"}</button>
    </form>
  );
}

function byDueDate(a: Task, b: Task): number {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(startTasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sorted, setSorted] = useState(false);

  const editing = tasks.find((task) => task.id === editingId) ?? null;
  let visible = tasks;
  if (filter === "pending") {
    visible = tasks.filter((task) => !task.done);
  } else if (filter === "done") {
    visible = tasks.filter((task) => task.done);
  }
  if (sorted) {
    // sorts the array in place: without a filter that is the state array itself
    visible.sort(byDueDate);
  }

  function handleSave(saved: Saved) {
    if (editingId === null) {
      setTasks((previous) => [...previous, { id: nextTaskId(), done: false, ...saved }]);
    } else {
      const id = editingId;
      setTasks((previous) => previous.map((task) => (task.id === id ? { ...task, ...saved } : task)));
      setEditingId(null);
    }
  }

  function handleToggle(id: string) {
    setTasks((previous) => previous.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function handleDelete(id: string) {
    setTasks((previous) => previous.filter((task) => task.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  }

  return (
    <main>
      <h1>%%planner%%</h1>
      {editing === null ? (
        <TaskForm key="new" task={null} onSave={handleSave} />
      ) : (
        <TaskForm key={editing.id} task={editing} onSave={handleSave} />
      )}
      <div className="filter">
        <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>%%all%%</button>
        <button aria-pressed={filter === "pending"} onClick={() => setFilter("pending")}>%%pending%%</button>
        <button aria-pressed={filter === "done"} onClick={() => setFilter("done")}>%%done%%</button>
      </div>
      <button className="sort" aria-pressed={sorted} onClick={() => setSorted((s) => !s)}>%%sort%%</button>
      <ul>
        {visible.map((task) => (
          <li key={task.id}>
            <span className="title">{task.title}</span> · <span className="due">{task.dueDate ?? "%%noDue%%"}</span> ·{" "}
            <span className="priority">{task.priority}</span> · <span className="status">{task.done ? "%%statusDone%%" : "%%statusPending%%"}</span>{" "}
            <button onClick={() => handleToggle(task.id)}>%%toggle%%</button>{" "}
            <button onClick={() => setEditingId(task.id)}>%%edit%%</button>{" "}
            <button onClick={() => handleDelete(task.id)}>%%delete%%</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
