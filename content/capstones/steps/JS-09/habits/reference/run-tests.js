// Runs the tests of tests/domain.test.js and prints one line per test. The page loads this file
// after app.js; on your computer `node run-tests.js` runs the same file.
import "./tests/domain.test.js";
import { run } from "./tests/testing.js";

const results = await run();

// Under Node.js a failed test makes the command fail (exit code 1), so `npm test` and other tools
// can see it. A browser has no `process`, so the page skips this part.
if (typeof process !== "undefined" && results.some((result) => !result.passed)) {
  process.exitCode = 1;
}
