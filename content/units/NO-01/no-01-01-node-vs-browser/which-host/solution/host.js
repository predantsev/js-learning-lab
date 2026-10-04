// Tells which host runs the code: 'node', 'browser' or 'unknown'.
// `host` is the global object to inspect: globalThis by default, a hand-made object in the checks.
export function detectHost(host = globalThis) {
  // Node: a `process` object that reports a Node version.
  if (host.process?.versions?.node) return 'node';
  // A page: both a window and a document (a web worker has neither).
  if (host.window && host.document) return 'browser';
  return 'unknown';
}
