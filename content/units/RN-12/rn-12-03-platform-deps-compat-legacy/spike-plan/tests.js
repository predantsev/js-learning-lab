import { noteSort, routes, spikeFirst, spikePlan } from './plan.js';
import { project } from './request.js';

test('each request gets the right route', () => {
  expect(routes?.shareSummary, 'routes.shareSummary').toBe('built-in');
  expect(routes?.stepCount, 'routes.stepCount').toBe('library');
  expect(routes?.ringPulse, 'routes.ringPulse').toBe('custom-module');
});

test('a spike comes first exactly where native code is added', () => {
  expect(spikeFirst?.shareSummary, 'spikeFirst.shareSummary').toBe(false);
  expect(spikeFirst?.stepCount, 'spikeFirst.stepCount').toBe(true);
  expect(spikeFirst?.ringPulse, 'spikeFirst.ringPulse').toBe(true);
});

test('the plan pins the exact library version', () => {
  expect(spikePlan?.library, 'spikePlan.library').toBe('step-sensor-legacy@1.9.0');
});

test('the plan names the project React Native version', () => {
  expect(spikePlan?.reactNative, 'spikePlan.reactNative').toBe(project.reactNative);
});

test('the plan runs on the declared target platforms', () => {
  expect(spikePlan?.targets, 'spikePlan.targets').toEqual(project.targets);
});

test('the test screen is described in at least 20 characters', () => {
  const text = typeof spikePlan?.testScreen === 'string' ? spikePlan.testScreen.trim() : '';
  expect(text.length, 'length of spikePlan.testScreen').toBeGreaterThanOrEqual(20);
});

test('the spike lives on its own branch', () => {
  const branch = typeof spikePlan?.branch === 'string' ? spikePlan.branch : '';
  expect(/^[\w./-]+$/.test(branch), `spikePlan.branch "${branch}" is a branch name without spaces`).toBe(true);
  expect(['main', 'master'].includes(branch), `spikePlan.branch "${branch}" is not the main branch`).toBe(false);
});

test('the plan rejects the library on a failed build, a crash or a missing feature', () => {
  const codes = Array.isArray(spikePlan?.rejectIf) ? spikePlan.rejectIf : [];
  for (const code of ['build-fails', 'crash-on-target', 'feature-missing']) {
    expect(codes.includes(code), `spikePlan.rejectIf includes '${code}'`).toBe(true);
  }
});

test('an unperformed iOS check is not a reason to reject', () => {
  const codes = Array.isArray(spikePlan?.rejectIf) ? spikePlan.rejectIf : [];
  expect(codes.includes('ios-unchecked'), "spikePlan.rejectIf includes 'ios-unchecked'").toBe(false);
});

test('the migration note is sorted into what interop covers and what must change', () => {
  expect(noteSort, 'noteSort').toEqual({ a: 'interop-covers', b: 'interop-covers', c: 'must-change', d: 'must-change', e: 'must-change' });
});
