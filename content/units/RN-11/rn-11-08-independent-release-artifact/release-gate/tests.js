import { deliveryPath, releaseCheck } from './release-gate.js';
import { candidateA, candidateB, installed } from './candidates.js';

const clean = { ...candidateA };
const variant = (changes) => ({ ...clean, ...changes });

test('a clean candidate passes with no problems', () => {
  expect(releaseCheck(installed, clean), 'releaseCheck for candidate A').toEqual({ problems: [], leftBehindApis: [] });
});

test('the identity and the version code are checked', () => {
  expect(releaseCheck(installed, variant({ id: 'com.example.jsll.loans2' })).problems, 'another id').toEqual(['id-changed']);
  expect(releaseCheck(installed, variant({ versionCode: 12 })).problems, 'versionCode equal to the installed one').toEqual(['version-not-higher']);
  expect(releaseCheck(installed, variant({ versionCode: 9 })).problems, 'a lower versionCode').toEqual(['version-not-higher']);
});

test('a different signer is a problem', () => {
  expect(releaseCheck(installed, variant({ signer: 'SHA-256 00:AA:…:11' })).problems, 'another signer').toEqual(['signer-differs']);
});

test('debug leftovers in the artifact are problems', () => {
  expect(releaseCheck(installed, variant({ debuggable: true })).problems, 'debuggable: true').toEqual(['debuggable']);
  expect(releaseCheck(installed, variant({ usesCleartextTraffic: true })).problems, 'usesCleartextTraffic: true').toEqual(['cleartext']);
  expect(releaseCheck(installed, variant({ bundleStrings: ['ok', '[dev] seed 50 loans'] })).problems, 'a [dev] string').toEqual(['dev-code-in-bundle']);
  expect(releaseCheck(installed, variant({ bundleStrings: ['API_SECRET=abc'] })).problems, 'a secret').toEqual(['secret-in-bundle']);
  expect(releaseCheck(installed, variant({ bundleStrings: ['ok', 'db Password: l1brary'] })).problems, 'a password').toEqual(['secret-in-bundle']);
  expect(releaseCheck(installed, variant({ bundleStrings: ['sk_live_00fake00'] })).problems, 'an sk_live_ key').toEqual(['secret-in-bundle']);
});

test('several problems are reported in the stated order', () => {
  expect(releaseCheck(installed, candidateB).problems, 'releaseCheck for candidate B').toEqual(['version-not-higher', 'cleartext', 'dev-code-in-bundle']);
});

test('Android versions below a raised minimum are listed as left behind', () => {
  expect(releaseCheck(installed, candidateB).leftBehindApis, 'minimum raised from 24 to 26').toEqual([24, 25]);
  expect(releaseCheck(installed, variant({ minAndroidApi: 29 })).leftBehindApis, 'minimum raised from 24 to 29').toEqual([24, 25, 26, 27, 28]);
  expect(releaseCheck(installed, variant({ minAndroidApi: 23 })).leftBehindApis, 'minimum lowered from 24 to 23').toEqual([]);
});

test('only JavaScript and asset changes can go over the air', () => {
  expect(deliveryPath([{ kind: 'js' }, { kind: 'asset' }]), 'js + asset').toBe('over-the-air');
  expect(deliveryPath([{ kind: 'js' }, { kind: 'icon' }]), 'js + icon').toBe('new-build');
  expect(deliveryPath([{ kind: 'permission' }]), 'permission').toBe('new-build');
  expect(deliveryPath([{ kind: 'native-module' }, { kind: 'js' }]), 'native-module + js').toBe('new-build');
  expect(deliveryPath([]), 'no changes').toBe('nothing');
});
