// The list screen: #/tasks. The form for a new task, the due count, the filter and the cards. Two
// queries: the tasks of the chosen filter for the cards, and all tasks for the due count. A filter
// change starts a new request and aborts the one still on its way. The filter is needed only here,
// so it is this screen's own state.
import { Profiler, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { countDueTasks } from "../domain/tasks.ts";
import type { Task } from "../domain/tasks.ts";
import type { ListFilter } from "../data/api.ts";
import { formatDay, LOCALE } from "./format.js";
import { TaskForm } from "./TaskForm.tsx";
import { TaskList } from "./TaskList.tsx";
import { Section } from "./Section.tsx";
import { QueryState } from "./QueryState.tsx";
import { useTasksList, useTaskMutations } from "./tasksCache.tsx";
import { useHeadingFocus } from "./focus.ts";
import { reportRender } from "./profile.ts";
import type { TaskFields } from "./tasksReducer.ts";

const PAGE_SIZE = 50;

export function TasksScreen({ today }: { today: string }) {
  const [filter, setFilter] = useState<ListFilter>("all");
  const list = useTasksList(filter);
  const all = useTasksList("all");
  const mutations = useTaskMutations();
  // What the last change did or why it failed; role="status" reads it out.
  const [notice, setNotice] = useState("");
  // The list heading takes focus after a route change and after the last card is deleted.
  const listHeadingRef = useHeadingFocus("%%listTitle%%");
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of a task whose Delete button gets it, "heading",
  // or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  const shown = list.items ?? [];
  // The measured cause: every card of a long list was rendered at once. Now the list shows PAGE_SIZE
  // cards per page, and "Show more" adds the next page; a filter change starts from the first page.
  const [pages, setPages] = useState(1);
  const visible = shown.slice(0, pages * PAGE_SIZE);
  // Where focus goes after "Show more": the first card of the new page (its index), or null.
  const focusFirstNew = useRef<number | null>(null);

  useEffect(() => {
    const index = focusFirstNew.current;
    if (index === null) {
      return;
    }
    focusFirstNew.current = null;
    listRef.current?.querySelectorAll<HTMLAnchorElement>("li.card h3 a")[index]?.focus();
  }, [pages]);

  function showMore() {
    focusFirstNew.current = pages * PAGE_SIZE;
    setPages(pages + 1);
  }

  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) {
      return;
    }
    const button = target === "heading" ? null : listRef.current?.querySelector<HTMLButtonElement>('[data-id="' + target + '"] [data-action="delete"]');
    // The removed card disappears only when the list has been read again; until then keep waiting.
    if (target !== "heading" && button === null && list.status === "refreshing") {
      return;
    }
    focusAfterRemove.current = null;
    (button ?? listHeadingRef.current)?.focus();
  });

  async function handleCreate(fields: TaskFields): Promise<boolean> {
    const result = await mutations.create(fields);
    setNotice(result.ok ? "" : result.message);
    return result.ok;
  }

  async function handleToggle(task: Task) {
    const result = await mutations.toggleDone(task);
    setNotice(result.ok ? "" : result.message);
  }

  async function handleRemove(id: string) {
    const index = shown.findIndex((task) => task.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    const result = await mutations.remove(id);
    if (result.ok) {
      focusAfterRemove.current = next === undefined ? "heading" : next.id;
    }
    setNotice(result.ok ? "" : result.message);
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || value === "pending" || value === "done") {
      setFilter(value);
      setPages(1);
    }
  }

  return (
    <>
      <Section title="%%formTitle%%">
        <TaskForm task={null} onSave={handleCreate} />
      </Section>
      <p role="status">{notice}</p>
      {all.items !== null && (
        <p>
          %%dueSummary%% {formatDay(today, LOCALE)}: {countDueTasks(all.items, today)}
        </p>
      )}
      <Section title="%%listTitle%%" headingRef={listHeadingRef}>
        <div className="field">
          <label htmlFor="list-filter">%%filterLabel%%</label>
          <select id="list-filter" value={filter} onChange={handleFilter}>
            <option value="all">%%filterAll%%</option>
            <option value="pending">%%filterPending%%</option>
            <option value="done">%%filterDone%%</option>
          </select>
        </div>
        <QueryState query={list} />
        {list.items !== null && (
          <Profiler id="list" onRender={reportRender}>
            <div ref={listRef}>
              <TaskList tasks={visible} emptyText={filter === "all" ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onToggle={handleToggle} onRemove={handleRemove} />
            </div>
            {visible.length < shown.length && (
              <button type="button" onClick={showMore}>
                %%moreLabel%%
              </button>
            )}
          </Profiler>
        )}
      </Section>
    </>
  );
}
