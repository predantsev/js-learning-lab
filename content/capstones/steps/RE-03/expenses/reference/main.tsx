// The entry of the project: it fetches the starting expenses when nothing usable is saved and starts
// React. App reads the saved expenses itself and keeps the storage in step with its list.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App.tsx";
import { loadExpenses } from "./storage/expenses.ts";
import type { Expense } from "./domain/expenses.ts";
import { loadFixtures } from "./data/fixtures.js";

// The starting expenses of data/expenses.json are needed only when nothing usable is saved. `await` at the
// top level of a module waits for them before the first render.
const startingExpenses: Expense[] = loadExpenses(localStorage).ok ? [] : await loadFixtures();

// StrictMode draws nothing itself: in development it runs every component twice and every effect
// as setup → cleanup → setup, so an effect that is not safe to repeat shows its bug at once.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App startingExpenses={startingExpenses} />
  </StrictMode>,
);
