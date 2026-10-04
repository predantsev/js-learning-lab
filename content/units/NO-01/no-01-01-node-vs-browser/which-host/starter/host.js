// Tells which host runs the code: 'node', 'browser' or 'unknown'.
// `host` is the global object to inspect: globalThis by default, a hand-made object in the checks.
export function detectHost(host = globalThis) {
  // Decide by what the host provides, not by what it calls itself.
  return 'unknown';
}
