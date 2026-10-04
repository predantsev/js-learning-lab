// triage(advisory, evidence): the decision for one security advisory.
//   advisory = { package, vulnerableBelow, fixedIn, affects }
//   evidence = { lock, usedExports }  (lock: a package-lock.json object; usedExports: package → names the server calls)
// Returns { action: 'keep' | 'upgrade' | 'replace', urgent: true | false }.
import { compareVersions } from './versions.js';

export function triage(advisory, evidence) {
  const entry = evidence.lock.packages[`node_modules/${advisory.package}`];
  // Not installed, or the installed version is already outside the vulnerable range: nothing to do.
  if (!entry || compareVersions(entry.version, advisory.vulnerableBelow) >= 0) return { action: 'keep', urgent: false };

  const action = advisory.fixedIn ? 'upgrade' : 'replace';
  // Urgent only when a request can reach it: a production package whose affected function the server calls.
  const called = evidence.usedExports[advisory.package] ?? [];
  const urgent = entry.dev !== true && called.includes(advisory.affects);
  return { action, urgent };
}
