// Schedules the same four callbacks from two places and prints the order they ran in.
import { readFile } from 'node:fs';

function scheduleFour(where) {
  const order = [];
  const record = (name) => {
    order.push(name);
    if (order.length === 4) console.log(`${where}: ${order.join(' → ')}`);
  };
  setTimeout(() => record('setTimeout 0'), 0);
  setImmediate(() => record('setImmediate'));
  Promise.resolve().then(() => record('promise'));
  process.nextTick(() => record('nextTick'));
}

// 1. From inside an I/O callback: Node runs it once the file has been read.
readFile('expenses.json', 'utf8', (error, text) => {
  if (error) throw error;
  console.log(`%%readDone%%: ${JSON.parse(text).length}`);
  scheduleFour('%%insideIo%%');
});

// 2. From the top level of the module (remove the two slashes to try it).
// scheduleFour('%%topLevel%%');
