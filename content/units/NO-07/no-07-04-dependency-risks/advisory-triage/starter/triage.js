// triage(advisory, evidence): the decision for one security advisory.
//   advisory = { package, vulnerableBelow, fixedIn, affects }
//   evidence = { lock, usedExports }  (lock: a package-lock.json object; usedExports: package → names the server calls)
// Returns { action: 'keep' | 'upgrade' | 'replace', urgent: true | false }.
import { compareVersions } from './versions.js';

export function triage(advisory, evidence) {
  // TODO: decide from the installed version, the fix, the dev flag and what the server calls.
  return { action: 'upgrade', urgent: true };
}
