// Misconception: an audit warning means my server is affected, whatever version is installed.
import { compareVersions } from './versions.js';

export function triage(advisory, evidence) {
  const entry = evidence.lock.packages[`node_modules/${advisory.package}`];

  const action = advisory.fixedIn ? 'upgrade' : 'replace';
  // Urgent only when a request can reach it: a production package whose affected function the server calls.
  const called = evidence.usedExports[advisory.package] ?? [];
  const urgent = entry?.dev !== true && called.includes(advisory.affects);
  return { action, urgent };
}
