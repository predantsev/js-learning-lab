import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.test.jsx";
import { run } from "./testing.js";
import { runPipeline } from "./pipeline.js";
import { reports } from "./reports.js";

// The same order as the CI workflow: lint → typecheck → test → build.
await runPipeline([
  { name: "lint", recorded: true, run: () => reports.lint },
  { name: "typecheck", recorded: true, run: () => reports.typecheck },
  {
    name: "test",
    run: async () => {
      const results = await run({ print: false });
      return {
        ok: results.length > 0 && results.every((result) => result.passed),
        lines: results.map((result) => (result.passed ? `✓ ${result.name}` : `✗ ${result.name} — ${result.message}`)),
      };
    },
  },
  { name: "build", recorded: true, run: () => reports.build },
]);

// Shown only after the tests: each test renders its own App, and two copies on one page would
// share the same field id.
createRoot(document.getElementById("root")).render(<App />);
