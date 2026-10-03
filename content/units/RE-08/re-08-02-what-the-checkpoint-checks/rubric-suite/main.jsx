// Shows the app, then runs the rubric checks from rubric.test.jsx and prints one line per check.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TaskBoard from "./TaskBoard";
import "./rubric.test.jsx";
import { run } from "./testing.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TaskBoard />
  </StrictMode>
);

await run();

// Two rubric rows that this sandbox cannot prove.
console.log("%%noteTypes%%");
console.log("%%noteData%%");
