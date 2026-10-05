// Demo: a planner request to a service that fails twice before it answers.
import { flakyFetch } from './demoFetch.js';
import { fetchWithRetry } from './retry.js';

const response = await fetchWithRetry('http://10.0.2.2:7310/records/planner', {
  fetchFn: flakyFetch(),
  timeoutMs: 1000,
  maxAttempts: 3,
  baseDelayMs: 100,
});
console.log(`final status: ${response.status}`);
