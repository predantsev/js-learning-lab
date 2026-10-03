// The list screen: #/habits. The form for a new habit, the completion rates, the filter and the
// cards. The filter is needed only here, so it is this screen's own state; the list comes from the
// data hook.
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { formatRates, sortHabitsByName, filterHabits } from "../domain/habits.ts";
import type { HabitStatus } from "../domain/habits.ts";
import { HabitForm } from "./HabitForm.tsx";
import { HabitList } from "./HabitList.tsx";
import { Section } from "./Section.tsx";
import { useHabitsData } from "./useHabits.ts";
import { useHeadingFocus } from "./focus.ts";
import type { HabitFields } from "./habitsReducer.ts";

type Filter = "all" | HabitStatus;

export function HabitsScreen({ today, days }: { today: string; days: string[] }) {
  const { habits, dispatch } = useHabitsData();
  const [filter, setFilter] = useState<Filter>("all");
  // The list heading takes focus after a route change and after the last card is deleted.
  const listHeadingRef = useHeadingFocus("%%listTitle%%");
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of a habit whose Delete button gets it, "heading",
  // or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  const shown = filter === "all" ? habits : filterHabits(habits, filter);

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
    const index = shown.findIndex((habit) => habit.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    focusAfterRemove.current = next === undefined ? "heading" : next.id;
    dispatch({ type: "removed", id: id });
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || value === "active" || value === "paused") {
      setFilter(value);
    }
  }

  return (
    <>
      <Section title="%%formTitle%%">
        <HabitForm habit={null} onSave={(fields: HabitFields) => dispatch({ type: "added", fields: fields })} />
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
            onRemove={handleRemove}
          />
        </div>
      </Section>
    </>
  );
}
