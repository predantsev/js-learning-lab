// The app's entry, as in the Vite template: StrictMode stays on.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BudgetAlerts from "./BudgetAlerts";
import { budgetFeed } from "./budgetFeed.js";
import { releaseNote } from "./releaseNotes.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BudgetAlerts />
  </StrictMode>,
);

// Half a second after the start the feed reports one category over its budget.
setTimeout(() => {
  budgetFeed.emit({ id: "food-oct", category: "%%food%%", overMinor: 12550 });
  console.log(`%%feedListeners%% ${budgetFeed.listenerCount()}`);
}, 500);
console.log(`%%noteFor%% ${releaseNote.version}: ${releaseNote.text || "%%noteEmpty%%"}`);
