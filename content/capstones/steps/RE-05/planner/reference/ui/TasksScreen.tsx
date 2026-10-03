// The list screen: #/tasks. The form for a new task, the due count, the filter and the cards. The
// filter is needed only here, so it is this screen's own state; the list comes from the data hook.
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { countDueTasks, filterTasks } from "../domain/tasks.ts";
import type { TaskStatus } from "../domain/tasks.ts";
import { formatDay, LOCALE } from "./format.js";
import { TaskForm } from "./TaskForm.tsx";
import { TaskList } from "./TaskList.tsx";
import { Section } from "./Section.tsx";
import { useTasksData } from "./useTasks.ts";
import { useHeadingFocus } from "./focus.ts";
import type { TaskFields } from "./tasksReducer.ts";

type Filter = "all" | TaskStatus;

export function TasksScreen({ today }: { today: string }) {
  const { tasks, dispatch } = useTasksData();
  const [filter, setFilter] = useState<Filter>("all");
  // The list heading takes focus after a route change and after the last card is deleted.
  const listHeadingRef = useHeadingFocus("%%listTitle%%");
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of a task whose Delete button gets it, "heading",
  // or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  const shown = filter === "all" ? tasks : filterTasks(tasks, filter);

  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) {
      return;
    }
    focusAfterRemove.current = null;
    const button = target === "heading" ? null : listRef.current?.querySelector<HTMLButtonElement>('[data-id="' + target + '"] [data-action="delete"]');
    (button ?? listHeadingRef.current)?.focus();
  });

  function handleRemove(id: string) {
    const index = shown.findIndex((task) => task.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    focusAfterRemove.current = next === undefined ? "heading" : next.id;
    dispatch({ type: "removed", id: id });
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || value === "pending" || value === "done") {
      setFilter(value);
    }
  }

  return (
    <>
      <Section title="%%formTitle%%">
        <TaskForm task={null} onSave={(fields: TaskFields) => dispatch({ type: "added", fields: fields })} />
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
          <TaskList tasks={shown} emptyText={tasks.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onToggle={(id) => dispatch({ type: "doneToggled", id: id })} onRemove={handleRemove} />
        </div>
      </Section>
    </>
  );
}
