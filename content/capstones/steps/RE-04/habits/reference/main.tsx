// The entry of the project: it fetches the starting habits when nothing usable is saved and starts
// React. App reads the saved habits itself and keeps the storage in step with its list.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App.tsx";
import { loadHabits } from "./storage/habits.ts";
import type { Habit } from "./domain/habits.ts";
import { loadFixtures } from "./data/fixtures.js";

// Fixed days, so the page shows the same as before: the day the "mark today" button records and
// the four days the completion rates are counted over.
const TODAY = "2026-03-02";
const LAST_DAYS = ["2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01"];

// The starting habits of data/habits.json are needed only when nothing usable is saved. `await` at the
// top level of a module waits for them before the first render.
const startingHabits: Habit[] = loadHabits(localStorage).ok ? [] : await loadFixtures();

// StrictMode draws nothing itself: in development it runs every component twice and every effect
// as setup → cleanup → setup, so an effect that is not safe to repeat shows its bug at once.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App startingHabits={startingHabits} today={TODAY} days={LAST_DAYS} />
  </StrictMode>,
);
