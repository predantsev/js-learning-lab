// Runs the test from HabitFeed.test.jsx, then shows the app.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./HabitFeed.test.jsx";
import { run } from "./testing.js";

await run();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
