// Development config: where the mock service runs and how each target reaches it.
export const MOCK_PORT = 7310;
export const LAN_ADDRESS = '192.168.1.20'; // the computer's address in the Wi-Fi network

// Wrong on purpose: "localhost is my computer" — true only where the app shares the computer's network.
export function mockBaseUrl(target) {
  if (target === 'phone-wifi') return `http://${LAN_ADDRESS}:${MOCK_PORT}`;
  if (['android-emulator', 'ios-simulator', 'android-usb'].includes(target)) return `http://localhost:${MOCK_PORT}`;
  throw new Error(`Unknown target: ${target}`);
}
