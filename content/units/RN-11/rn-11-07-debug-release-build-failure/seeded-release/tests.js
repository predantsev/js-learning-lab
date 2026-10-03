import { installOver, launchRelease, signRelease } from './simulated-release.js';
import { installed } from './target.js';
import { calls } from './dev/seed.js';

test('the release is signed with the key of the installed build', () => {
  const signed = signRelease();
  expect(signed.ok, signed.text).toBe(true);
  expect(signed.signer, 'certificate of the signing key').toBe(installed.signer);
});

test('the release installs as an update over build 4', () => {
  const install = installOver(installed.signer);
  expect(install.ok, install.text).toBe(true);
});

test('the release starts without running dev-only code', () => {
  const before = calls.count;
  const launch = launchRelease();
  expect(launch.ok, launch.text).toBe(true);
  expect(launch.wishes.map((wish) => wish.id), 'wishes on the first screen').toEqual(['w-01', 'w-02', 'w-03', 'w-04', 'w-05', 'w-06']);
  expect(calls.count - before, 'calls of seedDemoWishes in a release start').toBe(0);
});

test('no key path or password sits in the tracked files', () => {
  for (const name of ['app-config.js', 'start.js']) {
    const text = files[name] ?? '';
    expect(/password|\.keystore/i.test(text), `${name} mentions a password or a keystore`).toBe(false);
  }
});
