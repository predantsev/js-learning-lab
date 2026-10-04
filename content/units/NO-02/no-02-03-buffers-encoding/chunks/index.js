// Bytes versus characters, then a UTF-8 file decoded in 3-byte chunks.
import { readFileSync, writeFileSync } from 'node:fs';
import { StringDecoder } from 'node:string_decoder';

for (const text of ['cat', 'кіт', '🐈']) {
  console.log(`${text}: length ${text.length}, bytes ${Buffer.byteLength(text)}`);
}

// A habit name in Ukrainian, stored as UTF-8: 9 characters, 17 bytes.
writeFileSync('habit.txt', 'Пити воду');
const bytes = readFileSync('habit.txt'); // no encoding: a Buffer
console.log(bytes);

// The same bytes arriving in 3-byte chunks, as from a stream.
const chunks = [];
for (let start = 0; start < bytes.length; start += 3) chunks.push(bytes.subarray(start, start + 3));

let eachAlone = '';
for (const chunk of chunks) eachAlone += chunk.toString('utf8');
console.log('each chunk alone:', eachAlone);

const decoder = new StringDecoder('utf8');
let joined = '';
for (const chunk of chunks) joined += decoder.write(chunk); // keeps an unfinished character for the next chunk
joined += decoder.end();
console.log('StringDecoder:', joined);
