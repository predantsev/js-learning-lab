// Another valid approach: collect the facts first, then read the decision off them.
import { compareVersions } from './versions.js';

export function triage({ package: name, vulnerableBelow, fixedIn, affects }, { lock, usedExports }) {
  const entry = lock.packages[`node_modules/${name}`];
  const affected = entry !== undefined && compareVersions(entry.version, vulnerableBelow) < 0;
  if (!affected) return { action: 'keep', urgent: false };
  const production = !entry.dev;
  const reachable = (usedExports[name] ?? []).some((exported) => exported === affects);
  return { action: fixedIn === null ? 'replace' : 'upgrade', urgent: production && reachable };
}
