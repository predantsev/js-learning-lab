// Runs the PR's tests and, when it is there, your conflict.test.js: node run-tests.js
// The exit code is 1 when a test fails, so a CI step would stop here.
import { existsSync } from 'node:fs';
import { run } from './testing.js';

await import('./sync.test.js');
if (existsSync('conflict.test.js')) await import('./conflict.test.js');
const results = await run();
process.exitCode = results.every((result) => result.passed) ? 0 : 1;
