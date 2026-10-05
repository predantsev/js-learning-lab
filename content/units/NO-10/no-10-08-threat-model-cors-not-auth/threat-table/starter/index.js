// Prints your threat model and runs every proof it cites against a fresh lab server.
import { createLabServer } from './lab-server.js';
import { PROOFS } from './model.js';
import { threats } from './threats.js';

for (const row of threats) {
  const proof = PROOFS[row.proof];
  let verdict = '%%noSuchProof%%';
  if (proof) {
    const server = createLabServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      verdict = (await proof.run(`http://127.0.0.1:${server.address().port}`)) ? '✔' : '✖';
    } finally {
      server.closeAllConnections();
      server.close();
    }
  }
  console.log(`${verdict} [${row.entryPoint} → ${row.control}] ${row.threat} (${row.proof})`);
}
