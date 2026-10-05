import { createRoot } from "react-dom/client";
import App from "./App";
import { Measure } from "./profile";

// <Profiler> measures only what is inside it, so it wraps the whole page from outside.
createRoot(document.getElementById("root")).render(
  <Measure id="ExpenseSummary">
    <App />
  </Measure>,
);
