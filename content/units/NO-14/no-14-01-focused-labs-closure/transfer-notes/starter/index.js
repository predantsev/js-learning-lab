// Runs the three fresh checks and prints your note next to what really happened (read-only).
import { notes } from './notes.js';
import { skills } from './project.js';
import { runSqlCheck, runAuthCheck, runSsrCheck } from './fresh-checks.js';

const observed = { sql: runSqlCheck(), auth: await runAuthCheck(), ssr: runSsrCheck() };
const revisit = { sql: 'no-09-02-select-join-group', auth: 'no-10-04-expiry-revocation', ssr: 'no-13-04-mismatch-error-handling' };
const show = (value) => (value === undefined ? '—' : JSON.stringify(value));

for (const lab of ['sql', 'auth', 'ssr']) {
  const note = notes[lab] ?? {};
  const applied = Array.isArray(note.applied) ? note.applied : [];
  const stayed = Array.isArray(note.stayed) ? note.stayed.map((entry) => `${entry?.skill} (${entry?.because})`) : [];
  const unsorted = Object.keys(skills[lab]).filter((id) => !applied.includes(id) && !stayed.some((text) => text.startsWith(`${id} (`)));
  console.log(`— ${lab.toUpperCase()} —`);
  console.log(`  %%applied%%: ${applied.join(', ') || '—'}`);
  console.log(`  %%stayed%%: ${stayed.join(', ') || '—'}`);
  if (unsorted.length > 0) console.log(`  %%unsorted%%: ${unsorted.join(', ')}`);
  // The real result appears only once a prediction is written: predict first, then run.
  const real = note.predicted === undefined ? `%%predictFirst%%` : show(observed[lab]);
  console.log(`  %%check%%: ${real} · %%yourPrediction%%: ${show(note.predicted)} · %%yourRecord%%: ${show(note.observed)}`);
  if (note.predicted !== undefined && JSON.stringify(note.predicted) !== JSON.stringify(observed[lab])) {
    console.log(`  %%revisit%% ${revisit[lab]}`);
  }
}
