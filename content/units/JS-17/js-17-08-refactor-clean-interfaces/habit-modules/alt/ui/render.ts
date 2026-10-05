import type { Habit, HabitSummary } from "../types.ts";

export function renderSummary(root: HTMLElement, summary: HabitSummary, habits: readonly Habit[]): void {
  root.replaceChildren();
  const heading = document.createElement("h2");
  heading.textContent = `${summary.count} %%habits%%`;
  const line = document.createElement("p");
  line.textContent = `%%doneToday%% ${summary.doneToday} · %%completions%% ${summary.completions}`;
  const list = document.createElement("ul");
  list.append(...habits.map((habit) => {
    const item = document.createElement("li");
    item.textContent = habit.name;
    return item;
  }));
  root.append(heading, line, list);
}
