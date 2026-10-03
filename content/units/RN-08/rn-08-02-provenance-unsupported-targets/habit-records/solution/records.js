// records.js: two CP-RN records of the habit tracker's seven-day grid.
import { build, debugBuild, declaredTarget, iosSimulator } from './build.js';

// 1. The lifecycle check, performed on the declared target with the release build.
export const lifecycleRecord = {
  check: 'lifecycle',
  target: declaredTarget,
  build,
  procedure: '%%lifecycleProcedure%%',
  observed: '%%lifecycleObserved%%',
  outcome: 'pass',
  provenance: 'learner-authored',
};

// 2. The accessibility check on the iOS simulator, which this Windows computer cannot run.
export const iosSkip = {
  check: 'a11y',
  target: iosSimulator,
  provenance: 'skipped',
  reason: '%%iosReason%%',
  revisit: '%%iosRevisit%%',
};
