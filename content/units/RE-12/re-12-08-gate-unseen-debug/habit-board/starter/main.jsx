// The app's entry, as in the Vite template: StrictMode stays on. After the app starts, the feed
// publishes one completion, and the tests from HabitSearch.test.jsx run.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { completionFeed } from "./completionFeed.js";
import { resetFakeSearch } from "./fakeSearch.js";
import "./HabitSearch.test.jsx";
import { run } from "./testing.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

setTimeout(() => completionFeed.publish({ id: "c-01", habit: "%%h1%%", day: "2026-03-02" }), 300);

await run({ beforeEach: resetFakeSearch });
