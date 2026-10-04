// The signer is never compared: a release signed with a new key passes the gate.

const SECRET = /secret|password|sk_live_/i;

export function releaseCheck(installed, candidate) {
  const problems = [];
  if (candidate.id !== installed.id) problems.push('id-changed');
  if (!(candidate.versionCode > installed.versionCode)) problems.push('version-not-higher');
  if (candidate.debuggable === true) problems.push('debuggable');
  if (candidate.usesCleartextTraffic === true) problems.push('cleartext');
  if (candidate.bundleStrings.some((text) => text.includes('[dev]'))) problems.push('dev-code-in-bundle');
  if (candidate.bundleStrings.some((text) => SECRET.test(text))) problems.push('secret-in-bundle');

  const leftBehindApis = [];
  for (let api = installed.minAndroidApi; api < candidate.minAndroidApi; api += 1) leftBehindApis.push(api);
  return { problems, leftBehindApis };
}

const OVER_THE_AIR = ['js', 'asset'];

export function deliveryPath(changes) {
  if (changes.length === 0) return 'nothing';
  return changes.every((change) => OVER_THE_AIR.includes(change.kind)) ? 'over-the-air' : 'new-build';
}
