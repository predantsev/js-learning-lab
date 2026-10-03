// The entry of the project: it only starts React. The data hook reads the saved expenses and, without
// them, loads the starting ones while the page shows a loading state.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App.tsx";

// StrictMode draws nothing itself: in development it runs every component twice and every effect
// as setup → cleanup → setup, so an effect that is not safe to repeat shows its bug at once.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
