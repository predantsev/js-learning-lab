// Another valid solution: explicit typeof checks instead of optional chaining.
export function detectHost(host = globalThis) {
  const hasProcess = typeof host.process === 'object' && host.process !== null;
  if (hasProcess && typeof host.process.versions?.node === 'string') return 'node';
  if (typeof host.window === 'object' && typeof host.document === 'object') return 'browser';
  return 'unknown';
}
