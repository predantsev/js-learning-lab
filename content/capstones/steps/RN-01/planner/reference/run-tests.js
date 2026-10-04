// Runs the tests in tests/ with Node.js and prints one line per test: `npm test` runs it.
// The domain tests are the React project's own tests, copied unchanged with the code they test.
import "./tests/domain.test.js";
import "./tests/model.test.js";
import { run } from "./tests/testing.js";

const results = await run();

// A failed test makes the command fail (exit code 1), so `npm test` reports it.
if (results.some((result) => !result.passed)) {
  process.exitCode = 1;
}
