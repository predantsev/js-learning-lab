// Collects every problem first, then throws one Error that lists them all.
export function assertReleaseTransport(config) {
  const problems = [];
  if (config.tls.trustAllCertificates) problems.push('trustAllCertificates is on');
  if (config.build === 'release') {
    if (new URL(config.apiBaseUrl).protocol !== 'https:') problems.push('apiBaseUrl is not https');
    if (config.android.usesCleartextTraffic) problems.push('usesCleartextTraffic is on');
    if (config.android.cleartextDomains.length) problems.push(`cleartextDomains: ${config.android.cleartextDomains.join(', ')}`);
    if (config.ios.NSAllowsArbitraryLoads) problems.push('NSAllowsArbitraryLoads is on');
  }
  if (problems.length > 0) throw new Error(`${config.name}: ${problems.join('; ')}`);
}
