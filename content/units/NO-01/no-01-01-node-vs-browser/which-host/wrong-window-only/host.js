// Misconception: a `window` global means a page. A host can define `window` and still have no
// page: without `document` there is no DOM to work with.
export function detectHost(host = globalThis) {
  if (host.process?.versions?.node) return 'node';
  if (host.window) return 'browser';
  return 'unknown';
}
