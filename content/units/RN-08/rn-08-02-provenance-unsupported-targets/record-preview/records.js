// records.js: three CP-RN evidence records of the expense tracker's monthly summary.
// previewTarget (the browser preview) is imported but not used yet.
import { build, declaredTarget, iosSimulator, previewTarget } from './build.js';

export const records = [
  {
    check: 'restart',
    target: declaredTarget,
    build,
    procedure: '%%restartProcedure%%',
    observed: '%%restartObserved%%',
    outcome: 'pass',
    provenance: 'learner-authored',
  },
  {
    check: 'offline',
    target: declaredTarget,
    build,
    procedure: '%%offlineProcedure%%',
    observed: '%%offlineObserved%%',
    outcome: 'pass',
    provenance: 'learner-authored',
  },
  {
    check: 'a11y',
    target: iosSimulator,
    provenance: 'skipped',
    reason: '%%iosReason%%',
    revisit: '%%iosRevisit%%',
  },
];
