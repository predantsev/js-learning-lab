// readConfig returns early for an empty file — and forgets to close the file on that path.
import { open, writeFile } from 'node:fs/promises';

const handles = []; // every FileHandle readConfig opened, so we can count the open ones
const descriptors = []; // the descriptor number each one got when it was opened

async function readConfig(file) {
  const handle = await open(file);
  handles.push(handle);
  descriptors.push(handle.fd);
  const text = await handle.readFile('utf8');
  if (text.trim() === '') return {}; // early return: close() below never runs
  await handle.close();
  return JSON.parse(text);
}

await writeFile('config.json', ''); // an empty config file
for (let i = 0; i < 100; i++) await readConfig('config.json');

const stillOpen = handles.filter((handle) => handle.fd !== -1); // a closed FileHandle has fd -1
console.log(`calls: ${handles.length}, still open: ${stillOpen.length}`);
console.log(`descriptor numbers: first ${descriptors[0]}, last ${descriptors.at(-1)}`);

for (const handle of stillOpen) await handle.close(); // tidy up, so Node has nothing to complain about
