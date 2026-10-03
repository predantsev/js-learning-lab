// Shows the app, then runs your tests from MonthTotals.test.jsx and prints one line per test.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MonthTotals from "./MonthTotals";
import "./MonthTotals.test.jsx";
import { run } from "./testing.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MonthTotals />
  </StrictMode>
);

await run();
