// Driver (read-only): prints the note.
import { REQUIREMENTS, GAINS } from './options.js';
import { rscNote } from './note.js';

console.log('%%requires%%:');
for (const id of rscNote.requires) console.log(`  ${id} — ${REQUIREMENTS[id] ?? '%%unknownId%%'}`);
console.log('%%gains%%:');
for (const id of rscNote.gains) console.log(`  ${id} — ${GAINS[id] ?? '%%unknownId%%'}`);
console.log('%%blockers%%:');
for (const line of rscNote.blockers) console.log(`  ${line}`);
