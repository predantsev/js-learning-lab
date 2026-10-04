import { installOver, launchRelease, signRelease } from './simulated-release.js';
import { installed } from './target.js';
import { calls } from './dev/seed.js';
import { userGradleProperties } from './user-gradle-properties.js';

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

// A secret scan, like one run over a repository: it looks for the real password values and for a path
// to a key store, not for the word "password" (a comment explaining where passwords live is fine).
const STARTER_PASSWORD = 'r3lease-lab';
const passwordValues = () => {
  const values = [...userGradleProperties.matchAll(/^\s*MYAPP_UPLOAD_\w*PASSWORD\s*=\s*(\S+)\s*$/gm)].map((m) => m[1]);
  return [...new Set([STARTER_PASSWORD, ...values])];
};
const KEYSTORE_PATH = /[\w~.-]*[\w~-]\.keystore\b/i;

test('no key path or password sits in the tracked files', () => {
  for (const name of ['app-config.js', 'start.js']) {
    const text = files[name] ?? '';
    for (const value of passwordValues()) {
      expect(text.includes(value), `${name} contains a signing password`).toBe(false);
    }
    expect(text.match(KEYSTORE_PATH)?.[0] ?? null, `path to a key store in ${name}`).toBeNull();
  }
});
