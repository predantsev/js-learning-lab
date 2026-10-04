// Read-only driver: runs the import and prints every step with its number.
import { runImport } from './app.js';

let step = 0;
runImport('expenses.json', (line) => {
  step += 1;
  console.log(`${step}. ${line}`);
});
