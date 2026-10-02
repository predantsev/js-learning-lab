import type { Habit } from "./types.ts";
import { visibleHabits } from "./domain/visible.ts";
import { summarizeHabits } from "./domain/summary.ts";
import { renderSummary } from "./ui/render.ts";

// Hidden state: the search box and the date of "today" change it. Only this edge reads it now.
export const view = { query: "", today: "2026-03-01" };

export function showSummary(root: HTMLElement, habits: Habit[]): void {
  const visible = visibleHabits(habits, view.query);
  renderSummary(root, summarizeHabits(visible, view.today), visible);
}
