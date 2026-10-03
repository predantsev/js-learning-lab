// Runs your tests from HabitFeed.test.jsx, then shows the app.
import { createRoot } from "react-dom/client";
import App from "./App";
import "./HabitFeed.test.jsx";
import { run } from "./testing.js";

await run();

// StrictMode removed "to fix" the doubled rows: the effect still has no cleanup.
createRoot(document.getElementById("root")).render(<App />);
