// Two platform adapters with one shape: { baseUrl, storage: { get, set }, isOnline() }.
//
// STAND-INS for this Node.js run. Where they differ from the real thing:
// - the web adapter keeps its storage in a Map; in a browser it would wrap localStorage
//   (synchronous there — the async methods are the shared shape, not localStorage's own);
// - the native adapter keeps its storage in a Map; in the app it would wrap AsyncStorage;
// - isOnline() answers a flag set here; in a browser it would read navigator.onLine, in the app
//   expo-network's getNetworkStateAsync() — and both are only hints about the network, not about your server;
// - everything runs in one Node.js process on your computer, so 127.0.0.1 reaches the server here
//   for both adapters; on a device only the native adapter's address decides where the request goes.

function mapStorage() {
  const map = new Map();
  return { async get(key) { return map.get(key) ?? null; }, async set(key, value) { map.set(key, value); } };
}

export function createWebAdapter({ baseUrl, online = true }) {
  return { name: 'web', baseUrl, storage: mapStorage(), isOnline: async () => online };
}

// The emulator and the simulator reach the computer's loopback through different addresses.
const NATIVE_HOSTS = { 'ios-simulator': '127.0.0.1', 'android-emulator': '10.0.2.2' };

export function createNativeAdapter({ target, port, online = true }) {
  const host = NATIVE_HOSTS[target];
  if (host === undefined) throw new Error(`no address configured for the native target "${target}"`);
  return { name: `native/${target}`, baseUrl: `http://${host}:${port}`, storage: mapStorage(), isOnline: async () => online };
}
