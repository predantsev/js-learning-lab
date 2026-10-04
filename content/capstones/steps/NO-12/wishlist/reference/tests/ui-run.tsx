// Runs the user-action tests in the browser: `npm run build:tests` bundles this file into
// dist/tests.js, and the page tests.html loads it. Every result goes to the console and onto the page.
import "./ui.test.tsx";
import { run } from "./ui-testing.js";

const results: { name: string; passed: boolean; message?: string }[] = await run();
const failed = results.filter((result) => !result.passed).length;
const lines = results.map((result) => (result.passed ? "✓ " + result.name : "✗ " + result.name + " — " + result.message));
lines.push("%%rSummary%%".replace("{passed}", String(results.length - failed)).replace("{failed}", String(failed)));
const output = document.getElementById("results");
if (output !== null) {
  output.textContent = lines.join("\n");
}
