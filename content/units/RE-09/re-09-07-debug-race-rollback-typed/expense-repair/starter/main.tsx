// Runs your regression tests, then shows the screen. Read-only.
import { createRoot } from "react-dom/client";
import "./regressions.test";
import { run } from "./testing";
import { ExpenseScreen } from "./App";

await run();
createRoot(document.getElementById("root")!).render(<ExpenseScreen />);
