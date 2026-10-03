// The whole page as a tree of components: App → Section → HabitForm and Section → HabitList → one
// HabitCard per habit. App is the lowest common parent of the form and the list, so the shared state
// lives here: the list (through useHabits), the habit being edited and the filter. What only one card
// needs (a delete waiting for its confirmation) stays in that card.
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { formatRates, sortHabitsByName, filterHabits } from "../domain/habits.ts";
import type { Habit, HabitStatus } from "../domain/habits.ts";
import { HabitForm } from "./HabitForm.tsx";
import { HabitList } from "./HabitList.tsx";
import { Section } from "./Section.tsx";
import { useHabits } from "./useHabits.ts";
import type { HabitFields } from "./habitsReducer.ts";

type Filter = "all" | HabitStatus;

type AppProps = { startingHabits: Habit[]; today: string; days: string[] };

export function App({ startingHabits, today, days }: AppProps) {
  const [habits, dispatch] = useHabits(startingHabits);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of a habit whose Delete button gets it, "heading",
  // or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  // Computed during render from the same state, never stored: they cannot fall out of step.
  const editing = habits.find((habit) => habit.id === editingId) ?? null;
  const shown = filter === "all" ? habits : filterHabits(habits, filter);

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

  function handleSave(fields: HabitFields) {
    if (editingId === null) {
      dispatch({ type: "added", fields: fields });
    } else {
      dispatch({ type: "updated", id: editingId, fields: fields });
      setEditingId(null);
    }
  }

  function handleRemove(id: string) {
    const index = shown.findIndex((habit) => habit.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    focusAfterRemove.current = next === undefined ? "heading" : next.id;
    dispatch({ type: "removed", id: id });
    if (editingId === id) {
      setEditingId(null);
    }
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || value === "active" || value === "paused") {
      setFilter(value);
    }
  }

  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/habit.svg" alt="%%imageAlt%%" />
      <Section title="%%formTitle%%">
        {/* A new key gives a new form: picking another habit starts the form from that habit's data. */}
        <HabitForm key={editingId ?? "new"} habit={editing} onSave={handleSave} onCancel={() => setEditingId(null)} />
      </Section>
      <p>{formatRates(sortHabitsByName(filterHabits(habits, "active")), days)}</p>
      <Section title="%%listTitle%%" headingRef={listHeadingRef}>
        <div className="field">
          <label htmlFor="list-filter">%%filterLabel%%</label>
          <select id="list-filter" value={filter} onChange={handleFilter}>
            <option value="all">%%filterAll%%</option>
            <option value="active">%%filterActive%%</option>
            <option value="paused">%%filterPaused%%</option>
          </select>
        </div>
        <div ref={listRef}>
          <HabitList
            habits={shown}
            today={today}
            emptyText={habits.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"}
            onMarkToday={(id) => dispatch({ type: "completionAdded", id: id, day: today })}
            onToggleActive={(id) => dispatch({ type: "activeToggled", id: id })}
            onEdit={setEditingId}
            onRemove={handleRemove}
          />
        </div>
      </Section>
    </main>
  );
}
