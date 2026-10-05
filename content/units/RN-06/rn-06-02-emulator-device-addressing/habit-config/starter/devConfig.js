// Development config: where the mock service runs and how each target reaches it.
export const MOCK_PORT = 7310;
export const LAN_ADDRESS = '192.168.1.20'; // the computer's address in the Wi-Fi network

// TODO: return the mock service's base URL (no trailing slash) for the given target:
// 'android-emulator', 'ios-simulator', 'android-usb' (with adb reverse) or 'phone-wifi'.
export function mockBaseUrl(target) {
  return `http://localhost:${MOCK_PORT}`;
}
