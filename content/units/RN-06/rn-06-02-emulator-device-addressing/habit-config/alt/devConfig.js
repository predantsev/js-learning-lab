// Development config: where the mock service runs and how each target reaches it.
export const MOCK_PORT = 7310;
export const LAN_ADDRESS = '192.168.1.20'; // the computer's address in the Wi-Fi network

export function mockBaseUrl(target) {
  switch (target) {
    case 'android-emulator':
      return `http://10.0.2.2:${MOCK_PORT}`;
    case 'ios-simulator':
    case 'android-usb':
      return `http://localhost:${MOCK_PORT}`;
    case 'phone-wifi':
      return `http://${LAN_ADDRESS}:${MOCK_PORT}`;
    default:
      throw new Error('No mock service address for target ' + target);
  }
}
