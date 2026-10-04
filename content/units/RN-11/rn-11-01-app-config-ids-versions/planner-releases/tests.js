import { first, second, rules } from './releases.js';
import { shipOutcome } from './simulated-store.js';

const ID = 'com.example.jsll.planner';

test('the first release is 1.0.0, build 1, on both platforms', () => {
  expect(first.version, 'first.version').toBe('1.0.0');
  expect(first.android.package, 'first.android.package').toBe(ID);
  expect(first.ios.bundleIdentifier, 'first.ios.bundleIdentifier').toBe(ID);
  expect(Number(first.android.versionCode), 'first.android.versionCode').toBe(1);
  expect(Number(first.ios.buildNumber), 'first.ios.buildNumber').toBe(1);
});

test('the second release keeps the app identity', () => {
  expect(second.android.package, 'second.android.package').toBe(ID);
  expect(second.ios.bundleIdentifier, 'second.ios.bundleIdentifier').toBe(ID);
});

test('the second release shows users version 1.1.0', () => {
  expect(second.version, 'second.version').toBe('1.1.0');
});

test('the second release ships as an update on both platforms', () => {
  expect(shipOutcome('android', first, second), 'Android outcome').toBe('update');
  expect(shipOutcome('ios', first, second), 'iOS outcome').toBe('update');
});

test('versionCode is a whole number and buildNumber is text of digits', () => {
  for (const [name, release] of [['first', first], ['second', second]]) {
    expect(Number.isInteger(release.android.versionCode), `${name}.android.versionCode is a whole number`).toBe(true);
    expect(typeof release.ios.buildNumber, `type of ${name}.ios.buildNumber`).toBe('string');
    expect(release.ios.buildNumber, `${name}.ios.buildNumber`).toMatch(/^\d+$/);
  }
});

test('every field has a one-line rule', () => {
  for (const field of ['version', 'androidPackage', 'versionCode', 'iosBundleIdentifier', 'buildNumber']) {
    expect(typeof rules[field], `type of rules.${field}`).toBe('string');
    expect(rules[field].trim().length > 0, `rules.${field} is not empty`).toBe(true);
    expect(rules[field].includes('\n'), `rules.${field} has more than one line`).toBe(false);
  }
});
