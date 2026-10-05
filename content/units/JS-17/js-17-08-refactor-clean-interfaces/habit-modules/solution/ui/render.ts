import type { Habit, HabitSummary } from "../types.ts";

// renderSummary(root, summary, habits): draws the heading, the summary line and the list of the
// habits' names into root — exactly what showSummary draws today. It only draws: no counting.
export function renderSummary(root: HTMLElement, summary: HabitSummary, habits: readonly Habit[]): void {
  const heading = document.createElement("h2");
  heading.textContent = `${summary.count} %%habits%%`;
  const line = document.createElement("p");
  line.textContent = `%%doneToday%% ${summary.doneToday} · %%completions%% ${summary.completions}`;
  const list = document.createElement("ul");
  for (const habit of habits) {
    const item = document.createElement("li");
    item.textContent = habit.name;
    list.append(item);
  }
  root.replaceChildren(heading, line, list);
}
