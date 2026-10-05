// Wrong on purpose: "turning off certificate checks is harmless during development".
export function assertReleaseTransport(config) {
  if (config.build !== 'release') return;
  if (config.tls.trustAllCertificates) throw new Error(`${config.name}: trustAllCertificates must stay false`);
  if (!config.apiBaseUrl.startsWith('https://')) throw new Error(`${config.name}: apiBaseUrl must use https://`);
  if (config.android.usesCleartextTraffic) throw new Error(`${config.name}: usesCleartextTraffic must not be true`);
  if (config.android.cleartextDomains.length > 0) throw new Error(`${config.name}: cleartextDomains must be empty`);
  if (config.ios.NSAllowsArbitraryLoads) throw new Error(`${config.name}: NSAllowsArbitraryLoads must not be true`);
}
