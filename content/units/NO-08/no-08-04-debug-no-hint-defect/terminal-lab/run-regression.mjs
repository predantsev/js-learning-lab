// Runs your regression.test.js in the terminal: node run-regression.mjs
import './regression.test.js';
import { run } from './testing.js';

const results = await run();
process.exitCode = results.every((result) => result.passed) && results.length > 0 ? 0 : 1;
