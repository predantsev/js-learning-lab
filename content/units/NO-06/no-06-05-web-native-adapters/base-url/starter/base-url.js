// Which base URL each target needs to reach the planner API running on this computer.
//
// config: { port, bindHost, lanAddress }
//   port       — the API's port, for example 7330
//   bindHost   — the address the API listens on: '127.0.0.1' (loopback, the default) or '0.0.0.0'
//   lanAddress — this computer's address in the local network, for example '192.168.1.20' (may be missing)
export function resolveBaseUrl(target, config) {
  // TODO: 'web', 'ios-simulator', 'android-emulator', 'device'
  return '';
}
