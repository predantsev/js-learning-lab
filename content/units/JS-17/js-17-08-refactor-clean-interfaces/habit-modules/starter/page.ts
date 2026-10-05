import type { Habit } from "./types.ts";

// Hidden state: the search box and the date of "today" change it.
export const view = { query: "", today: "2026-03-01" };

// Filters, summarizes and draws the habits — all in one function.
export function showSummary(root: HTMLElement, habits: Habit[]): void {
  root.replaceChildren();
  let count = 0;
  let doneToday = 0;
  let completions = 0;
  for (const habit of habits) {
    if (habit.active && habit.name.toLowerCase().includes(view.query.toLowerCase())) {
      count = count + 1;
      completions = completions + habit.completions.length;
    }
    if (habit.active && habit.name.toLowerCase().includes(view.query.toLowerCase()) && habit.completions.includes(view.today)) {
      doneToday = doneToday + 1;
    }
  }
  const heading = document.createElement("h2");
  heading.textContent = `${count} %%habits%%`;
  const line = document.createElement("p");
  line.textContent = `%%doneToday%% ${doneToday} · %%completions%% ${completions}`;
  const list = document.createElement("ul");
  for (const habit of habits) {
    if (habit.active && habit.name.toLowerCase().includes(view.query.toLowerCase())) {
      const item = document.createElement("li");
      item.textContent = habit.name;
      list.append(item);
    }
  }
  root.append(heading, line, list);
}
