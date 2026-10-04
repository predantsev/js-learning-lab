// plan.js: your decisions.

// 1. The route for every request: 'built-in', 'library' or 'custom-module'.
export const routes = { ringPulse: 'custom-module', stepCount: 'library', shareSummary: 'built-in' };

// 2. Does a compatibility spike have to come first? true or false.
export const spikeFirst = { shareSummary: false, stepCount: true, ringPulse: true };

// 3. The spike plan for the step library.
export const spikePlan = {
  library: 'step-sensor-legacy@1.9.0', //    name@version, exactly as the request names it
  reactNative: '0.86.3', // the project's version, exactly as in package.json
  targets: ['android'], //    the platforms the spike runs on
  testScreen: `%%screenText%%`, // what the one minimal test screen does
  branch: 'try-step-sensor-legacy', //     the git branch the spike lives on — deleting it is the rollback
  rejectIf: ['slow-on-device', 'feature-missing', 'crash-on-target', 'build-fails'], //   codes from REJECT_CODES
};

// 4. Every line of the migration note: 'interop-covers' or 'must-change'.
export const noteSort = { a: 'interop-covers', b: 'interop-covers', c: 'must-change', d: 'must-change', e: 'must-change' };
