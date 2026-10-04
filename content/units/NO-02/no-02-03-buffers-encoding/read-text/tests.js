// Checks for readTextFile with files written byte by byte under .tmp/.
import { writeFile } from 'node:fs/promises';
import { readTextFile } from './app.js';

async function fileWith(name, content) {
  const file = tmp(name);
  await writeFile(file, content);
  return file;
}

test('returns a string, not a Buffer', async () => {
  expect(typeof readTextFile, 'type of readTextFile').toBe('function');
  const result = await readTextFile(await fileWith('ascii.txt', 'w-02'));
  expect(typeof result, 'type of the result for a file with "w-02"').toBe('string');
});

test('decodes Ukrainian text, ₴ and an emoji as UTF-8', async () => {
  expect(typeof readTextFile, 'type of readTextFile').toBe('function');
  const text = 'Кава з друзями · 180 ₴ 🐈';
  const result = await readTextFile(await fileWith('label.txt', Buffer.from(text, 'utf8')));
  expect(result, 'result for a UTF-8 file').toBe(text);
});

test('rejects bytes that are not valid UTF-8', async () => {
  expect(typeof readTextFile, 'type of readTextFile').toBe('function');
  // "Пити" saved in windows-1251: one byte per letter, not valid UTF-8.
  const file = await fileWith('legacy.txt', Buffer.from([0xcf, 0xe8, 0xf2, 0xe8]));
  let outcome = 'resolved';
  let value;
  try {
    value = await readTextFile(file);
  } catch {
    outcome = 'rejected';
  }
  expect(outcome, `readTextFile on invalid bytes (it gave ${JSON.stringify(String(value))})`).toBe('rejected');
});
