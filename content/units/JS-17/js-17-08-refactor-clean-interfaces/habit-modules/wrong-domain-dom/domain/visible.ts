import type { Habit } from "../types.ts";

// visibleHabits(habits, query): the active habits whose name contains the query, compared
// without regard to letter case, in their original order. Pure: no page and no `view`.
// Reads every name through a page element "the way the page shows it": the domain touches the page.
export function visibleHabits(habits: readonly Habit[], query: string): Habit[] {
  const needle = query.toLowerCase();
  return habits.filter((habit) => {
    const probe = document.createElement("span");
    probe.textContent = habit.name;
    return habit.active && probe.textContent.toLowerCase().includes(needle);
  });
}
