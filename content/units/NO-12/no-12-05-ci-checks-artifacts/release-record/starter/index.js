// A demo (read-only): packs a small artifact, records it, verifies it, then changes one byte.
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createReleaseRecord, verifyRelease } from './release.js';

const bundle = { name: 'wishlist-service', version: '2.1.0', files: { 'server.js': "console.log('%%hello%%');\n" } };
const artifact = 'wishlist-service-2.1.0.bundle.gz';
await writeFile(artifact, gzipSync(JSON.stringify(bundle)));

const record = await createReleaseRecord(artifact, { name: 'wishlist-service', version: '2.1.0', commit: '9f3c2ab', node: process.version });
console.log(record);
console.log('%%verifyIntact%%', await verifyRelease(artifact));

const bytes = await readFile(artifact);
bytes[bytes.length - 5] ^= 1; // flip one bit near the end
await writeFile(artifact, bytes);
console.log('%%verifyChanged%%', await verifyRelease(artifact));
