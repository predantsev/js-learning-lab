// Runs your integration tests: `node run-tests.js` in a terminal, or Run on the platform.
import './integration.test.js';
import { run } from './testing.js';

const results = await run();
if (results.some((result) => result.status === 'failed')) process.exitCode = 1;
