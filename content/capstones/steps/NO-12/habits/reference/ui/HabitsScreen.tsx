// The list screen: #/habits. The form for a new habit, the completion rates, the filter and the
// cards. Two queries: the habits of the chosen filter for the cards, and all habits for the rates. A
// filter change starts a new request and aborts the one still on its way. The filter is needed only
// here, so it is this screen's own state.
import { Profiler, useEffect, useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { formatRates, sortHabitsByName, filterHabits, searchHabits } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";
import type { ListFilter } from "../data/api.ts";
import { HabitForm } from "./HabitForm.tsx";
import { HabitList } from "./HabitList.tsx";
import { Section } from "./Section.tsx";
import { Link } from "./router.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHabitsList, useHabitMutations } from "./habitsCache.tsx";
import { useHeadingFocus } from "./focus.ts";
import { reportRender } from "./profile.ts";
import type { HabitFields } from "./habitsReducer.ts";

const PAGE_SIZE = 50;

export function HabitsScreen({ today, days }: { today: string; days: string[] }) {
  const [filter, setFilter] = useState<ListFilter>("all");
  // The search: `text` is the field's value and stays urgent, so every letter shows at once; `query`
  // filters the list and changes in a transition, which React interrupts when the next letter comes.
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const list = useHabitsList(filter);
  const all = useHabitsList("all");
  const mutations = useHabitMutations();
  // What the last change did or why it failed; role="status" reads it out.
  const [notice, setNotice] = useState("");
  // The list heading takes focus after a route change and after the last card is deleted.
  const listHeadingRef = useHeadingFocus("%%listTitle%%");
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of a habit whose Delete button gets it, "heading",
  // or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  const shown = list.items ?? [];
  // The measured cause: every card of a long list was rendered at once. Now the list shows PAGE_SIZE
  // cards per page, and "Show more" adds the next page; a filter change starts from the first page.
  const [pages, setPages] = useState(1);
  const found = searchHabits(shown, query);
  const visible = found.slice(0, pages * PAGE_SIZE);
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

  function report(result: { ok: true } | { ok: false; message: string }) {
    setNotice(result.ok ? "" : result.message);
  }

  async function handleCreate(fields: HabitFields): Promise<boolean> {
    const result = await mutations.create(fields);
    report(result);
    return result.ok;
  }

  async function handleRemove(id: string) {
    const index = shown.findIndex((habit) => habit.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    const result = await mutations.remove(id);
    if (result.ok) {
      focusAfterRemove.current = next === undefined ? "heading" : next.id;
    }
    report(result);
  }

  // Pausing writes the whole habit: its fields with `active` turned over (the completions stay).
  async function handleToggleActive(habit: Habit) {
    report(await mutations.save(habit.id, { name: habit.name, frequency: habit.frequency, active: !habit.active }));
  }

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setText(value);
    startTransition(() => {
      setQuery(value);
      setPages(1);
    });
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || value === "active" || value === "paused") {
      setFilter(value);
      setPages(1);
    }
  }

  return (
    <>
      <Section title="%%formTitle%%">
        <HabitForm habit={null} onSave={handleCreate} />
      </Section>
      <p role="status">{notice}</p>
      {all.items !== null && <p>{formatRates(sortHabitsByName(filterHabits(all.items, "active")), days)}</p>}
      <p>
        <Link to="/habits/summary">%%summaryLinkLabel%%</Link>
      </p>
      <Section title="%%listTitle%%" headingRef={listHeadingRef}>
        <div className="field">
          <label htmlFor="list-filter">%%filterLabel%%</label>
          <select id="list-filter" value={filter} onChange={handleFilter}>
            <option value="all">%%filterAll%%</option>
            <option value="active">%%filterActive%%</option>
            <option value="paused">%%filterPaused%%</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="list-search">%%searchLabel%%</label>
          <input id="list-search" type="search" value={text} onChange={handleSearch} />
        </div>
        <p role="status">{isPending ? "%%searchingMessage%%" : ""}</p>
        <QueryState query={list} />
        {list.items !== null && (
          <Profiler id="list" onRender={reportRender}>
            <div ref={listRef} className={isPending ? "stale" : undefined} aria-busy={isPending}>
              <HabitList
                habits={visible}
                today={today}
                emptyText={query !== "" ? "%%searchEmptyMessage%%" : filter === "all" ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"}
                onMarkToday={async (habit) => report(await mutations.markDay(habit, today))}
                onToggleActive={handleToggleActive}
                onRemove={handleRemove}
              />
            </div>
            {visible.length < found.length && (
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
