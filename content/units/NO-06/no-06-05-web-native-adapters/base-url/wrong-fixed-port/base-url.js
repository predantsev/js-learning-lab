// Which base URL each target needs to reach the planner API running on this computer.
//
// config: { port, bindHost, lanAddress }
//   port       — the API's port, for example 7330
//   bindHost   — the address the API listens on: '127.0.0.1' (loopback, the default) or '0.0.0.0'
//   lanAddress — this computer's address in the local network, for example '192.168.1.20' (may be missing)
const LOOPBACK = ['127.0.0.1', 'localhost', '::1'];

export function resolveBaseUrl(target, config) {
  const { port, bindHost, lanAddress } = config;
  // Mistake: the browser's port is written in the code instead of taken from the configuration.
  if (target === 'web' || target === 'ios-simulator') return 'http://127.0.0.1:7331';
  if (target === 'android-emulator') return `http://10.0.2.2:${port}`;
  if (target === 'device') {
    if (LOOPBACK.includes(bindHost)) {
      throw new Error(`a device cannot reach a server bound to ${bindHost}; bind it to the network for the check, then back`);
    }
    if (!lanAddress) throw new Error('a device needs the lanAddress of this computer');
    return `http://${lanAddress}:${port}`;
  }
  throw new Error(`unknown target "${target}"`);
}
