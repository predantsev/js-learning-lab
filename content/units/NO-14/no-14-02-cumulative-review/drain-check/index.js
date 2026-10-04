// The "missing drain wait" item, run for real: the same slow writable stream filled twice —
// once ignoring false from write(), once waiting for 'drain' — and the largest queue each time.
import { Writable } from 'node:stream';
import { once } from 'node:events';

function slowTray() {
  return new Writable({
    highWaterMark: 32,
    write(chunk, encoding, done) {
      setTimeout(done, 5); // every chunk takes 5 ms to store
    },
  });
}

async function fill(tray, waitForDrain) {
  let largestQueue = 0;
  for (let i = 0; i < 20; i++) {
    const roomLeft = tray.write('x'.repeat(16));
    largestQueue = Math.max(largestQueue, tray.writableLength);
    if (!roomLeft && waitForDrain) await once(tray, 'drain');
  }
  tray.end();
  await once(tray, 'finish');
  return largestQueue;
}

console.log(`%%without%% ${await fill(slowTray(), false)} %%bytes%%`);
console.log(`%%with%% ${await fill(slowTray(), true)} %%bytes%%`);
