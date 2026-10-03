// The entry of the project: it fetches the starting tasks when nothing usable is saved and starts
// React. App reads the saved tasks itself and keeps the storage in step with its list.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App.tsx";
import { loadTasks } from "./storage/tasks.ts";
import type { Task } from "./domain/tasks.ts";
import { loadFixtures } from "./data/fixtures.js";

// The day the page counts due tasks for; a fixed day, so the page shows the same as before.
const TODAY = "2026-03-02";

// The starting tasks of data/tasks.json are needed only when nothing usable is saved. `await` at the
// top level of a module waits for them before the first render.
const startingTasks: Task[] = loadTasks(localStorage).ok ? [] : await loadFixtures();

// StrictMode draws nothing itself: in development it runs every component twice and every effect
// as setup → cleanup → setup, so an effect that is not safe to repeat shows its bug at once.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App startingTasks={startingTasks} today={TODAY} />
  </StrictMode>,
);
