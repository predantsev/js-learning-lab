// Throws an Error when the build's transport settings are unsafe; returns nothing when they are fine.
export function assertReleaseTransport(config) {
  // Never, in any build: without the certificate check anyone on the network can pose as the server.
  if (config.tls.trustAllCertificates === true) {
    throw new Error(`${config.name}: trustAllCertificates must stay false`);
  }
  if (config.build !== 'release') return; // plain HTTP to the development host is fine in debug

  if (!config.apiBaseUrl.startsWith('https://')) {
    throw new Error(`${config.name}: apiBaseUrl must use https:// in a release build`);
  }
  if (config.android.usesCleartextTraffic === true) {
    throw new Error(`${config.name}: usesCleartextTraffic must not be true in a release build`);
  }
  if (config.android.cleartextDomains.length > 0) {
    throw new Error(`${config.name}: cleartextDomains must be empty in a release build`);
  }
  if (config.ios.NSAllowsArbitraryLoads === true) {
    throw new Error(`${config.name}: NSAllowsArbitraryLoads must not be true in a release build`);
  }
}
