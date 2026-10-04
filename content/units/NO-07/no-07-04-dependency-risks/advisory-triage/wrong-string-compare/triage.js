// Misconception: version numbers can be compared as text.
import { compareVersions } from './versions.js';

export function triage(advisory, evidence) {
  const entry = evidence.lock.packages[`node_modules/${advisory.package}`];
  // Not installed, or the installed version is already outside the vulnerable range: nothing to do.
  if (!entry || entry.version >= advisory.vulnerableBelow) return { action: 'keep', urgent: false };

  const action = advisory.fixedIn ? 'upgrade' : 'replace';
  // Urgent only when a request can reach it: a production package whose affected function the server calls.
  const called = evidence.usedExports[advisory.package] ?? [];
  const urgent = entry.dev !== true && called.includes(advisory.affects);
  return { action, urgent };
}
