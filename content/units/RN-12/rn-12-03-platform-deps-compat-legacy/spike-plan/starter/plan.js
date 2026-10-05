// plan.js: your decisions.

// 1. The route for every request: 'built-in', 'library' or 'custom-module'.
export const routes = { shareSummary: '', stepCount: '', ringPulse: '' };

// 2. Does a compatibility spike have to come first? true or false.
export const spikeFirst = { shareSummary: null, stepCount: null, ringPulse: null };

// 3. The spike plan for the step library.
export const spikePlan = {
  library: '', //    name@version, exactly as the request names it
  reactNative: '', // the project's version, exactly as in package.json
  targets: [], //    the platforms the spike runs on
  testScreen: '', // what the one minimal test screen does
  branch: '', //     the git branch the spike lives on — deleting it is the rollback
  rejectIf: [], //   codes from REJECT_CODES
};

// 4. Every line of the migration note: 'interop-covers' or 'must-change'.
export const noteSort = { a: '', b: '', c: '', d: '', e: '' };
