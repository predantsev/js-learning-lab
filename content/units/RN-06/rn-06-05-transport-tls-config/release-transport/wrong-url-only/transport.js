// Wrong on purpose: only the address is checked. The platform settings and the certificate check are not.
export function assertReleaseTransport(config) {
  if (config.build === 'release' && !config.apiBaseUrl.startsWith('https://')) {
    throw new Error(`${config.name}: apiBaseUrl must use https:// in a release build`);
  }
}
