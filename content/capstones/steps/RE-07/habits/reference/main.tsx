// The entry of the project: it only starts React. The data hook reads the saved habits and, without
// them, loads the starting ones while the page shows a loading state.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App.tsx";

// Fixed days, so the page shows the same as before: the day the "mark today" button records and
// the four days the completion rates are counted over.
const TODAY = "2026-03-02";
const LAST_DAYS = ["2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01"];

// StrictMode draws nothing itself: in development it runs every component twice and every effect
// as setup → cleanup → setup, so an effect that is not safe to repeat shows its bug at once.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App today={TODAY} days={LAST_DAYS} />
  </StrictMode>,
);
