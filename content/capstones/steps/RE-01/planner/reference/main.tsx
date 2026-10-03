// The entry of the project: it reads the tasks once and hands them to React. Reading the storage
// stays here, outside the components: a component only shows the data it receives.
import { createRoot } from "react-dom/client";
import { App } from "./ui/App.tsx";
import { loadTasks } from "./storage/tasks.ts";
import type { Task } from "./domain/tasks.ts";
import { loadFixtures } from "./data/fixtures.js";

// The day the page counts due tasks for; a fixed day, so the page shows the same as before.
const TODAY = "2026-03-02";

// Saved tasks win; without them (or instead of damaged ones) the page shows the starting tasks
// from data/tasks.json. `await` at the top level of a module waits before the first render.
const saved = loadTasks(localStorage);
const tasks: Task[] = saved.ok ? saved.tasks : await loadFixtures();

createRoot(document.getElementById("root")!).render(<App tasks={tasks} today={TODAY} />);
