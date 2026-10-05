// Misconception: any `process` object means Node. A browser bundle may bring its own `process`
// stand-in (with `env`, but no `versions.node`), and the page is then called Node.
export function detectHost(host = globalThis) {
  if (host.process) return 'node';
  if (host.window && host.document) return 'browser';
  return 'unknown';
}
