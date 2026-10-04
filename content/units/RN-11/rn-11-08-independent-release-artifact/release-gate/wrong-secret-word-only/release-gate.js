// Only the word "secret" is searched for, so passwords and live payment keys slip through.

export function releaseCheck(installed, candidate) {
  const problems = [];
  if (candidate.id !== installed.id) problems.push('id-changed');
  if (!(candidate.versionCode > installed.versionCode)) problems.push('version-not-higher');
  if (candidate.signer !== installed.signer) problems.push('signer-differs');
  if (candidate.debuggable === true) problems.push('debuggable');
  if (candidate.usesCleartextTraffic === true) problems.push('cleartext');
  if (candidate.bundleStrings.some((text) => text.includes('[dev]'))) problems.push('dev-code-in-bundle');
  if (candidate.bundleStrings.some((text) => /secret/i.test(text))) problems.push('secret-in-bundle');

  const leftBehindApis = [];
  for (let api = installed.minAndroidApi; api < candidate.minAndroidApi; api += 1) leftBehindApis.push(api);
  return { problems, leftBehindApis };
}

export function deliveryPath(changes) {
  if (changes.length === 0) return 'nothing';
  return changes.every((change) => change.kind === 'js' || change.kind === 'asset') ? 'over-the-air' : 'new-build';
}
