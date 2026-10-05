// Read-only driver: prints the summary of the active habits.
import { summarize } from './app.js';

for (const line of summarize()) console.log(line);
