// The whole page as a tree of components: App → Section → HabitForm and Section → HabitList → one
// HabitCard per habit. App owns the list, the habit being edited and the filter; every change is a
// new list computed by the pure domain functions, which stay exactly as they were.
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { formatRates, sortHabitsByName, filterHabits, addHabit, updateHabit, removeHabit, completeHabit } from "../domain/habits.ts";
import type { Habit, HabitStatus } from "../domain/habits.ts";
import { HabitForm } from "./HabitForm.tsx";
import type { HabitFields } from "./HabitForm.tsx";
import { HabitList } from "./HabitList.tsx";
import { Section } from "./Section.tsx";
import { loadHabits, saveHabits } from "../storage/habits.ts";

type Filter = "all" | HabitStatus;

// An id that no habit of the list has yet (saved habits may already use "h-7").
function newId(list: Habit[]): string {
  let number = list.length + 1;
  while (list.some((habit) => habit.id === "h-" + number)) {
    number += 1;
  }
  return "h-" + number;
}

type AppProps = { startingHabits: Habit[]; today: string; days: string[] };

export function App({ startingHabits, today, days }: AppProps) {
  // Read once: a function given to useState runs only on the first render. loadHabits checks every
  // saved record; without usable saved habits the list starts from the starting ones.
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = loadHabits(localStorage);
    return saved.ok ? saved.habits : startingHabits;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  // Keeps localStorage in step with the list: after every commit in which `habits` changed, the
  // whole list is written as { schemaVersion: 1, records }, replacing what was stored. Writing the
  // same list again changes nothing, so StrictMode's second run in development is harmless; a write
  // switches nothing on, so the effect needs no cleanup.
  useEffect(() => {
    saveHabits(localStorage, habits);
  }, [habits]);

  // Computed during render from the same state, never stored: they cannot fall out of step.
  const editing = habits.find((habit) => habit.id === editingId) ?? null;
  const shown = filter === "all" ? habits : filterHabits(habits, filter);

  function handleSave(fields: HabitFields) {
    if (editingId === null) {
      setHabits((previous) => addHabit(previous, newId(previous), fields));
    } else {
      const id = editingId;
      setHabits((previous) => updateHabit(previous, id, fields));
      setEditingId(null);
    }
  }

  // The day comes from the props: completeHabit adds it once, as a new completions array.
  function handleMarkToday(id: string) {
    setHabits((previous) => completeHabit(previous, id, today));
  }

  function handleRemove(id: string) {
    setHabits((previous) => removeHabit(previous, id));
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
      <Section title="%%listTitle%%">
        <div className="field">
          <label htmlFor="list-filter">%%filterLabel%%</label>
          <select id="list-filter" value={filter} onChange={handleFilter}>
            <option value="all">%%filterAll%%</option>
            <option value="active">%%filterActive%%</option>
            <option value="paused">%%filterPaused%%</option>
          </select>
        </div>
        <HabitList habits={shown} today={today} emptyText={habits.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onMarkToday={handleMarkToday} onEdit={setEditingId} onRemove={handleRemove} />
      </Section>
    </main>
  );
}
