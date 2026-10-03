// Development config of the expenses app: where the mock service is for each target.
export const MOCK_PORT = 7310;
export const LAN_ADDRESS = '192.168.1.20';

export function mockBaseUrl(target) {
  if (target === 'android-emulator') return `http://10.0.2.2:${MOCK_PORT}`;
  if (target === 'ios-simulator' || target === 'android-usb') return `http://localhost:${MOCK_PORT}`;
  if (target === 'phone-wifi') return `http://${LAN_ADDRESS}:${MOCK_PORT}`;
  throw new Error(`Unknown target: ${target}`);
}
