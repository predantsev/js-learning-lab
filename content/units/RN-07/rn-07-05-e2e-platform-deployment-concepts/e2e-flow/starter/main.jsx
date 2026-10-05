// Runs flow.js on the simulated device and prints one line per step. Do not edit.
import { flow } from './flow.js';
import { createDevice } from './simDevice.js';
import { runFlow } from './e2eRunner.js';

console.log(`%%runsOn%%: ${flow.runsOn || '—'}`);
const passed = runFlow(flow, createDevice(), (line) => console.log(line));
console.log(passed ? '%%flowPassed%%' : '%%flowFailed%%');
