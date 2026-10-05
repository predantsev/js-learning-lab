// Prints your decision for three synthetic advisories about the expenses server (read-only).
import { lock, usedExports } from './evidence.js';
import { triage } from './triage.js';

const advisories = [
  { package: 'money-fmt', vulnerableBelow: '2.4.0', fixedIn: '2.4.0', affects: 'format' },
  { package: 'csv-tidy', vulnerableBelow: '1.0.0', fixedIn: null, affects: 'parseCsv' },
  { package: 'test-kit', vulnerableBelow: '1.9.0', fixedIn: '1.9.0', affects: 'run' },
];
for (const advisory of advisories) {
  console.log(`${advisory.package} (< ${advisory.vulnerableBelow}, ${advisory.affects}) → ${JSON.stringify(triage(advisory, { lock, usedExports }))}`);
}
