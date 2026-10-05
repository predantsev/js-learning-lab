// The same rules as a table of checks, kept in the required order.
const RULES = [
  ['id-changed', (i, c) => c.id !== i.id],
  ['version-not-higher', (i, c) => c.versionCode <= i.versionCode],
  ['signer-differs', (i, c) => c.signer !== i.signer],
  ['debuggable', (i, c) => c.debuggable === true],
  ['cleartext', (i, c) => c.usesCleartextTraffic === true],
  ['dev-code-in-bundle', (i, c) => c.bundleStrings.some((s) => s.includes('[dev]'))],
  ['secret-in-bundle', (i, c) => c.bundleStrings.some((s) => /secret|password|sk_live_/i.test(s))],
];

export function releaseCheck(installed, candidate) {
  const problems = RULES.filter(([, broken]) => broken(installed, candidate)).map(([code]) => code);
  const raised = Math.max(0, candidate.minAndroidApi - installed.minAndroidApi);
  const leftBehindApis = Array.from({ length: raised }, (_, i) => installed.minAndroidApi + i);
  return { problems, leftBehindApis };
}

export function deliveryPath(changes) {
  if (!changes.length) return 'nothing';
  const needsBinary = changes.some(({ kind }) => kind !== 'js' && kind !== 'asset');
  return needsBinary ? 'new-build' : 'over-the-air';
}
