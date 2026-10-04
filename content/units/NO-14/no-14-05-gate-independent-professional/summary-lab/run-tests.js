// Runs your summary.test.js in the terminal: node run-tests.js (exit code 1 if a test fails).
import { run } from './testing.js';

await import('./summary.test.js');
const results = await run();
process.exitCode = results.length > 0 && results.every((result) => result.passed) ? 0 : 1;
