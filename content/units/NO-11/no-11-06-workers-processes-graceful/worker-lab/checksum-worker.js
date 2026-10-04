// Runs in a worker thread: receives { amounts, rounds } or { records, rounds }, answers with the checksum.
import { parentPort } from 'node:worker_threads';
import { checksum } from './checksum.js';

parentPort.on('message', ({ amounts, records, rounds }) => {
  parentPort.postMessage(checksum(amounts ?? records.map((record) => record.amountMinor), rounds));
});
