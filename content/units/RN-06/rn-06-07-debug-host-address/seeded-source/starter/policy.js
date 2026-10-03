// Reads an Android network security configuration the way the platform applies it to plain HTTP:
// a <domain-config> that names the host decides; otherwise <base-config> does; without either, plain HTTP
// is not permitted (the default for apps that target Android 9 or newer).
export function cleartextPermitted(xmlText, host) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('networkSecurityConfig is not well-formed XML');
  for (const config of doc.querySelectorAll('domain-config')) {
    const names = [...config.querySelectorAll(':scope > domain')].map((domain) => domain.textContent.trim());
    if (names.includes(host)) return config.getAttribute('cleartextTrafficPermitted') === 'true';
  }
  const base = doc.querySelector('base-config');
  return base?.getAttribute('cleartextTrafficPermitted') === 'true';
}
