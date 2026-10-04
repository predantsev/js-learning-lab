// Runs the tests in tests/ and prints one line per test: `npm test` runs it with Node.js.
import "./tests/domain.test.js";
import "./tests/repository.test.js";
import "./tests/address.test.js";
import "./tests/performance.test.js";
import "./tests/reducer.test.js";
import "./tests/model.test.js";
import "./tests/streak.test.js";
import { run } from "./tests/testing.js";

const results = await run();

// Under Node.js a failed test makes the command fail (exit code 1), so `npm test` and other tools
// can see it. In a browser globalThis.process is undefined, so the page skips this part.
const nodeProcess = globalThis.process; // Node.js has it, a browser does not
if (nodeProcess !== undefined && results.some((result) => !result.passed)) {
  nodeProcess.exitCode = 1;
}
