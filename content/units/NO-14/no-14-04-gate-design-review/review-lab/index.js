// What `npm test` does in the local task, here in one run: the PR's tests on the PR's code.
import { run } from './testing.js';

await import('./sync.test.js');
await run();
