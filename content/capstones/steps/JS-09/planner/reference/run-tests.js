// Runs the tests of tests/domain.test.js and prints one line per test. The page loads this file
// after app.js; on your computer `node run-tests.js` runs the same file.
import "./tests/domain.test.js";
import { run } from "./tests/testing.js";

const results = await run();

// Under Node.js a failed test makes the command fail (exit code 1), so `npm test` and other tools
// can see it. In a browser globalThis.process is undefined, so the page skips this part.
const nodeProcess = globalThis.process; // Node.js has it, a browser does not
if (nodeProcess !== undefined && results.some((result) => !result.passed)) {
  nodeProcess.exitCode = 1;
}
