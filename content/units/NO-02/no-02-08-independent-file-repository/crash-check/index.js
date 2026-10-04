// What crash-check.mjs demands after every restart, tried on three made-up results.
// (crash-check.mjs itself starts child processes, which the platform does not allow:
// it runs only in your own terminal.)
import { checkInvariants } from './invariants.js';

const lunch = (id) => ({ id, label: 'Lunch', amountMinor: 21050, date: '2026-03-02', category: 'food' });
const confirmed = ['e-0001', 'e-0002'];

const cases = {
  'old file, one unconfirmed save lost': [lunch('e-0001'), lunch('e-0002')],
  'a confirmed save is missing': [lunch('e-0001')],
  'a half-written record': [lunch('e-0001'), lunch('e-0002'), { id: 'e-0003', label: 'Lu' }],
};
for (const [what, records] of Object.entries(cases)) {
  const problems = checkInvariants(records, confirmed);
  console.log(`${what}: ${problems.length === 0 ? 'ok' : problems.join('; ')}`);
}
