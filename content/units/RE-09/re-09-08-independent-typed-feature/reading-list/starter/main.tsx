// Runs your transition tests, then shows the app. Read-only.
import { createRoot } from "react-dom/client";
import "./transitions.test";
import { run } from "./testing";
import App from "./App";

await run();
createRoot(document.getElementById("root")!).render(<App />);
