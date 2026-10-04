// Runs create-bookmarks-ops.mjs here and checks last night's backup against the contract.
// The service itself needs your ops.js and runs only in your terminal.
await import('./create-bookmarks-ops.mjs');
const { readFile } = await import('node:fs/promises');
const { schemaErrors } = await import('./bookmarks-ops/contract.js');
const backup = JSON.parse(await readFile('bookmarks-ops/backups/last-night/bookmarks.json', 'utf8'));
console.log(`backups/last-night: ${backup.records.length} bookmarks, contract problems: ${JSON.stringify(schemaErrors(backup.records))}`);
console.log((await readFile('bookmarks-ops/RUNBOOK.md', 'utf8')).split('\n').filter((line) => line.startsWith('## ')).join('\n'));
