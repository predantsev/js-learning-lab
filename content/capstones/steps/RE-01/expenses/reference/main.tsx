// The entry of the project: it reads the expenses once and hands them to React. Reading the storage
// stays here, outside the components: a component only shows the data it receives.
import { createRoot } from "react-dom/client";
import { App } from "./ui/App.tsx";
import { loadExpenses } from "./storage/expenses.ts";
import type { Expense } from "./domain/expenses.ts";
import { loadFixtures } from "./data/fixtures.js";

// Saved expenses win; without them (or instead of damaged ones) the page shows the starting
// expenses from data/expenses.json. `await` at the top level of a module waits before the first render.
const saved = loadExpenses(localStorage);
const expenses: Expense[] = saved.ok ? saved.expenses : await loadFixtures();

createRoot(document.getElementById("root")!).render(<App expenses={expenses} />);
