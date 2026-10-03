// The whole page as a tree of components: App → Section → TaskForm and Section → TaskList → one
// TaskCard per task. App is the lowest common parent of the form and the list, so the shared state
// lives here: the list (through useTasks), the task being edited and the filter. What only one card
// needs (a delete waiting for its confirmation) stays in that card.
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { countDueTasks, filterTasks } from "../domain/tasks.ts";
import type { Task, TaskStatus } from "../domain/tasks.ts";
import { formatDay, LOCALE } from "./format.js";
import { TaskForm } from "./TaskForm.tsx";
import { TaskList } from "./TaskList.tsx";
import { Section } from "./Section.tsx";
import { useTasks } from "./useTasks.ts";
import type { TaskFields } from "./tasksReducer.ts";

type Filter = "all" | TaskStatus;

type AppProps = { startingTasks: Task[]; today: string };

export function App({ startingTasks, today }: AppProps) {
  const [tasks, dispatch] = useTasks(startingTasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of a task whose Delete button gets it, "heading",
  // or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  // Computed during render from the same state, never stored: they cannot fall out of step.
  const editing = tasks.find((task) => task.id === editingId) ?? null;
  const shown = filter === "all" ? tasks : filterTasks(tasks, filter);

  // Runs after every commit; it does something only when a delete has asked for it. The card that had
  // focus is gone after the commit, so focus moves to the next card (or the previous one), and to the
  // list heading when no card is left.
  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) {
      return;
    }
    focusAfterRemove.current = null;
    const button = target === "heading" ? null : listRef.current?.querySelector<HTMLButtonElement>('[data-id="' + target + '"] [data-action="delete"]');
    (button ?? listHeadingRef.current)?.focus();
  });

  function handleSave(fields: TaskFields) {
    if (editingId === null) {
      dispatch({ type: "added", fields: fields });
    } else {
      dispatch({ type: "updated", id: editingId, fields: fields });
      setEditingId(null);
    }
  }

  function handleRemove(id: string) {
    const index = shown.findIndex((task) => task.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    focusAfterRemove.current = next === undefined ? "heading" : next.id;
    dispatch({ type: "removed", id: id });
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
      <Section title="%%listTitle%%" headingRef={listHeadingRef}>
        <div className="field">
          <label htmlFor="list-filter">%%filterLabel%%</label>
          <select id="list-filter" value={filter} onChange={handleFilter}>
            <option value="all">%%filterAll%%</option>
            <option value="pending">%%filterPending%%</option>
            <option value="done">%%filterDone%%</option>
          </select>
        </div>
        <div ref={listRef}>
          <TaskList
            tasks={shown}
            emptyText={tasks.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"}
            onToggle={(id) => dispatch({ type: "doneToggled", id: id })}
            onEdit={setEditingId}
            onRemove={handleRemove}
          />
        </div>
      </Section>
    </main>
  );
}
