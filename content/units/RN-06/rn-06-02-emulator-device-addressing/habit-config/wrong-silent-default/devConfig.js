// Development config: where the mock service runs and how each target reaches it.
export const MOCK_PORT = 7310;
export const LAN_ADDRESS = '192.168.1.20'; // the computer's address in the Wi-Fi network

// Wrong on purpose: a misspelled target silently gets localhost instead of a clear error.
export function mockBaseUrl(target) {
  if (target === 'android-emulator') return `http://10.0.2.2:${MOCK_PORT}`;
  if (target === 'phone-wifi') return `http://${LAN_ADDRESS}:${MOCK_PORT}`;
  return `http://localhost:${MOCK_PORT}`;
}
