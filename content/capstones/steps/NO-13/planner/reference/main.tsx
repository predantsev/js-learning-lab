// The entry of the project: it only starts React. The data hook reads the saved tasks and, without
// them, loads the starting ones while the page shows a loading state.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App.tsx";

// The day the page counts due tasks for; a fixed day, so the page shows the same as before.
const TODAY = "2026-03-02";

// StrictMode draws nothing itself: in development it runs every component twice and every effect
// as setup → cleanup → setup, so an effect that is not safe to repeat shows its bug at once.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App today={TODAY} />
  </StrictMode>,
);
