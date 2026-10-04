// Asks this host which APIs it provides. `typeof` never throws, even for a name that does not exist.
import { readFileSync } from 'node:fs';

console.log(`Node.js ${process.version}`);
console.log('typeof document:', typeof document);
console.log('typeof window:', typeof window);
console.log('typeof process:', typeof process);
console.log('typeof fetch:', typeof fetch);
console.log('typeof setTimeout:', typeof setTimeout);
console.log('typeof URL:', typeof URL);

// Node reads files directly: here, the first line of this very file.
const firstLine = readFileSync('index.js', 'utf8').split('\n')[0];
console.log('%%firstLine%%:', firstLine);
