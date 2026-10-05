// Sums 302,500 synthetic expenses while another callback, which puts itself back in the queue with
// setImmediate every time it runs, counts how many turns it got.
import { sumInBatches } from './app.js';

const expenses = Array.from({ length: 302_500 }, (_, i) => ({ id: `e-${i}`, amountMinor: (i * 7) % 1000 }));

let turns = 0;
let finished = false;
const other = () => {
  if (finished) return;
  turns += 1;
  setImmediate(other);
};
setImmediate(other);
const started = performance.now();
const total = await sumInBatches(expenses, 5000);
const ms = performance.now() - started;
finished = true;
console.log(`%%total%%: ${total}`);
console.log(`%%took%% ${ms.toFixed(0)} %%ms%%, %%turns%%: ${turns}`);
