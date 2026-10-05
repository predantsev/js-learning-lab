// evidence.js (read-only): the course's rules for one CP-RN evidence record.
//
// A performed check:
//   { check, target, build: { id, version, fingerprint }, procedure, observed, outcome: 'pass' | 'fail', provenance }
// A skip record (the check was NOT performed):
//   { check, target, provenance: 'skipped', reason, revisit }
//
// judge(record, { declaredTarget, build }) → { status, reason? }
//   status: 'passed' | 'assisted' | 'failed' | 'supplied' | 'skipped' | 'rejected'
//   reason (only when rejected): 'unknown-check' | 'unknown-provenance' | 'skip-without-reason' |
//     'skip-claims-result' | 'not-native-evidence' | 'screenshot-only' | 'incomplete' |
//     'wrong-build' | 'wrong-target'
export const CHECKS = ['restart', 'offline', 'lifecycle', 'security', 'a11y', 'performance'];
export const PROVENANCES = ['learner-authored', 'assisted', 'supplied', 'skipped'];

const filled = (value) => typeof value === 'string' && value.trim() !== '';
const rejected = (reason) => ({ status: 'rejected', reason });
const sameTarget = (a, b) => a?.kind === b.kind && a?.name === b.name && a?.os === b.os;
const sameBuild = (a, b) => a?.id === b.id && a?.version === b.version && a?.fingerprint === b.fingerprint;

export function judge(record, { declaredTarget, build }) {
  if (!CHECKS.includes(record?.check)) return rejected('unknown-check');
  if (!PROVENANCES.includes(record.provenance)) return rejected('unknown-provenance');

  // A skip says what was not done, why, and what it takes to come back. It never carries a result.
  if (record.provenance === 'skipped') {
    if (!record.target || !filled(record.reason) || !filled(record.revisit)) return rejected('skip-without-reason');
    if (record.outcome !== undefined || record.observed !== undefined) return rejected('skip-claims-result');
    return { status: 'skipped' };
  }

  // A browser preview never proves native behavior, however good the record looks.
  if (record.target?.kind === 'browser-preview') return rejected('not-native-evidence');

  // What was done and what was seen, in words. A picture alone does not say either.
  if (!filled(record.procedure) || !filled(record.observed) || !['pass', 'fail'].includes(record.outcome)) {
    return rejected(record.screenshot ? 'screenshot-only' : 'incomplete');
  }

  // Someone else's evidence is kept as information; it is never the learner's pass.
  if (record.provenance === 'supplied') return { status: 'supplied' };

  if (!sameBuild(record.build, build)) return rejected('wrong-build');
  if (!sameTarget(record.target, declaredTarget)) return rejected('wrong-target');
  if (record.outcome === 'fail') return { status: 'failed' };
  return { status: record.provenance === 'assisted' ? 'assisted' : 'passed' };
}
