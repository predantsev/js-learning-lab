// Writes two files — valid UTF-8 and bytes saved in an old single-byte encoding — and reads both.
import { writeFile } from 'node:fs/promises';
import { readTextFile } from './app.js';

await writeFile('expense.txt', '%%label%%');
// The same kind of label as an old program might have saved it: one byte per letter (windows-1251).
await writeFile('legacy.txt', Buffer.from([0xcf, 0xf0, 0xee, 0xe4, 0xf3, 0xea, 0xf2, 0xe8]));

for (const file of ['expense.txt', 'legacy.txt']) {
  try {
    const text = await readTextFile(file);
    console.log(`${file}: ${typeof text} ${JSON.stringify(text)}`);
  } catch (error) {
    console.log(`${file}: ${error.name}: ${error.message}`);
  }
}
