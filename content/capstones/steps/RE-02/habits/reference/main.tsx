// The entry of the project: it reads the habits once and hands them to React as the starting list.
// Reading the storage stays here, outside the components; from now on App owns the list.
import { createRoot } from "react-dom/client";
import { App } from "./ui/App.tsx";
import { loadHabits } from "./storage/habits.ts";
import type { Habit } from "./domain/habits.ts";
import { loadFixtures } from "./data/fixtures.js";

// Fixed days, so the page shows the same as before: the day the "mark today" button records and
// the four days the completion rates are counted over.
const TODAY = "2026-03-02";
const LAST_DAYS = ["2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01"];

// Saved habits win; without them (or instead of damaged ones) the page shows the starting habits
// from data/habits.json. `await` at the top level of a module waits before the first render.
const saved = loadHabits(localStorage);
const habits: Habit[] = saved.ok ? saved.habits : await loadFixtures();

createRoot(document.getElementById("root")!).render(<App initialHabits={habits} today={TODAY} days={LAST_DAYS} />);
