// Sums 300,000 synthetic expenses while a 10 ms "heartbeat" interval counts how often it got a turn.
import { sumInBatches } from './app.js';

const expenses = Array.from({ length: 300_000 }, (_, i) => ({ id: `e-${i}`, amountMinor: (i * 7) % 1000 }));

let beats = 0;
const heartbeat = setInterval(() => (beats += 1), 10);
const started = performance.now();
const total = await sumInBatches(expenses, 5000);
const ms = performance.now() - started;
clearInterval(heartbeat);
console.log(`%%total%%: ${total}`);
console.log(`%%took%% ${ms.toFixed(0)} %%ms%%, %%heartbeats%%: ${beats}`);
