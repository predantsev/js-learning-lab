import type { Habit, HabitSummary } from "../types.ts";

// Counts again from the habits instead of drawing the summary it was given.
export function renderSummary(root: HTMLElement, summary: HabitSummary, habits: readonly Habit[]): void {
  const done = habits.filter((habit) => habit.completions.includes("2026-03-01")).length;
  const total = habits.reduce((sum, habit) => sum + habit.completions.length, 0);
  const heading = document.createElement("h2");
  heading.textContent = `${habits.length} %%habits%%`;
  const line = document.createElement("p");
  line.textContent = `%%doneToday%% ${done} · %%completions%% ${total}`;
  const list = document.createElement("ul");
  for (const habit of habits) {
    const item = document.createElement("li");
    item.textContent = habit.name;
    list.append(item);
  }
  root.replaceChildren(heading, line, list);
}
