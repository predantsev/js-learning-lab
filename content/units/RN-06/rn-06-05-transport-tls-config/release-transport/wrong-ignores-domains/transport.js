// Wrong on purpose: a cleartext exception for a few domains looks harmless, but it ships in the release too.
export function assertReleaseTransport(config) {
  if (config.tls.trustAllCertificates) throw new Error(`${config.name}: trustAllCertificates must stay false`);
  if (config.build !== 'release') return;
  if (!config.apiBaseUrl.startsWith('https://')) throw new Error(`${config.name}: apiBaseUrl must use https://`);
  if (config.android.usesCleartextTraffic) throw new Error(`${config.name}: usesCleartextTraffic must not be true`);
  if (config.ios.NSAllowsArbitraryLoads) throw new Error(`${config.name}: NSAllowsArbitraryLoads must not be true`);
}
