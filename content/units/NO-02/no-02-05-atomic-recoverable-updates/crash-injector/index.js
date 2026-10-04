// Two ways to save the wishlist, each interrupted half-way by a simulated crash.
//
// How this crash simulation differs from a real one:
// - the program does not really die: `crash()` throws, the "restart" is just the next lines of code;
// - the cut is always at exactly half of the bytes; a real crash can cut anywhere (or nowhere);
// - the operating system keeps written data in memory for a while: after a real power cut, data
//   that was never flushed with sync() can be lost even when the program "finished" writing.
import { open, readFile, readdir, rename, writeFile } from 'node:fs/promises';

const oldData = { schemaVersion: 1, records: [{ id: 'w-02', name: '%%lamp%%', acquired: false }] };
const newData = { schemaVersion: 1, records: [{ id: 'w-02', name: '%%lamp%%', acquired: true }] };

class SimulatedCrash extends Error {}
const crash = () => {
  throw new SimulatedCrash('crash');
};

async function writeHalfThenCrash(file, data) {
  const bytes = Buffer.from(JSON.stringify(data));
  const handle = await open(file, 'w'); // 'w' empties the file at once
  try {
    await handle.write(bytes.subarray(0, bytes.length / 2));
    crash();
  } finally {
    await handle.close();
  }
}

async function readerSees(file) {
  try {
    const { records } = JSON.parse(await readFile(file, 'utf8'));
    return `acquired = ${records[0].acquired}`;
  } catch (error) {
    return `${error.name}: ${error.message}`;
  }
}

// 1. In place: write straight into wishlist.json.
await writeFile('wishlist.json', JSON.stringify(oldData));
try {
  await writeHalfThenCrash('wishlist.json', newData);
} catch (error) {
  if (!(error instanceof SimulatedCrash)) throw error;
}
console.log('in place, after the crash:', await readerSees('wishlist.json'));

// 2. Temp file, then rename: the crash hits the temp file.
await writeFile('wishlist.json', JSON.stringify(oldData));
try {
  await writeHalfThenCrash('wishlist.json.1.tmp', newData);
} catch (error) {
  if (!(error instanceof SimulatedCrash)) throw error;
}
console.log('temp file, after the crash:', await readerSees('wishlist.json'));
console.log('folder:', (await readdir('.')).filter((name) => name.startsWith('wishlist')).join(', '));

// 3. The same, without a crash: write the temp file completely, flush it, then one rename.
const handle = await open('wishlist.json.2.tmp', 'w');
try {
  await handle.writeFile(JSON.stringify(newData));
  await handle.sync();
} finally {
  await handle.close();
}
await rename('wishlist.json.2.tmp', 'wishlist.json');
console.log('temp file, after the rename:', await readerSees('wishlist.json'));
