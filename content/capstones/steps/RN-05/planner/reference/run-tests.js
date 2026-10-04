// Runs the tests in tests/ with Node.js and prints one line per test: `npm test` runs it.
// tests/domain.test.js, tests/model.test.js and tests/reducer.test.js are the React project's own tests,
// copied unchanged with the code they test; the other test files test the modules of this project.
import "./tests/domain.test.js";
import "./tests/model.test.js";
import "./tests/reducer.test.js";
import "./tests/draft.test.js";
import "./tests/adapters.test.js";
import "./tests/repository.test.js";
import "./tests/snapshot.test.js";
import "./tests/links.test.js";
import { run } from "./tests/testing.js";

const results = await run();

// A failed test makes the command fail (exit code 1), so `npm test` reports it.
if (results.some((result) => !result.passed)) {
  process.exitCode = 1;
}
