// Misconception: "no window" means Node. An object with neither host's APIs is called Node too.
export function detectHost(host = globalThis) {
  return host.window === undefined ? 'node' : 'browser';
}
