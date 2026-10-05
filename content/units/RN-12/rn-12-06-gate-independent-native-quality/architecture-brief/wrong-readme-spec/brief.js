// brief.js: your architecture and interop brief.
import { build, debugBuild, declaredTarget, iosSimulator } from './build.js';

// 1. trace.txt: which variant is cheaper at the boundary ('A' or 'B'), and how many times less
//    boundary time it spends (a whole number).
export const trace = { cheaper: 'B', times: 16 };

// 2. supplied.js readme: every line 'legacy' or 'new'.
export const readmeLabels = { a: 'new', b: 'legacy', c: 'legacy', d: 'new', e: 'legacy', f: 'legacy' };

// 3. supplied.js requests: the route of each, and whether a compatibility spike comes first.
export const routes = { monthTotal: 'javascript', shareSummary: 'built-in', scanReceipt: 'library' };
export const spikeFirst = { monthTotal: false, shareSummary: false, scanReceipt: true };

// 4. Evidence records (evidence.js): the restart check you performed yourself on the declared target
//    with the release build, and the screen-reader check on the iOS simulator this computer cannot run.
export const restartRecord = {
  check: 'restart',
  target: declaredTarget,
  build,
  procedure: `%%restartProcedure%%`,
  observed: `%%restartObserved%%`,
  outcome: 'pass',
  provenance: 'learner-authored',
};
export const iosReaderSkip = {
  check: 'a11y',
  target: iosSimulator,
  provenance: 'skipped',
  reason: `%%iosReason%%`,
  revisit: `%%iosRevisit%%`,
};

// 5. In your own words: why scanReceipt needs native code and a spike, and monthTotal does not.
export const whyNative = `%%whyNative%%`;
