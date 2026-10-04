// Misconception: the user-agent text says which host it is. Node before 21 has no navigator at
// all, and a web worker also says "Mozilla" without having a page.
export function detectHost(host = globalThis) {
  const agent = host.navigator?.userAgent ?? '';
  if (agent.startsWith('Node.js')) return 'node';
  if (agent.startsWith('Mozilla')) return 'browser';
  return 'unknown';
}
