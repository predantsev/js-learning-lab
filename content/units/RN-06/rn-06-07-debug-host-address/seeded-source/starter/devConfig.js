// Development config of the expenses app: where the mock service is for each target.
export const MOCK_PORT = 7310;
export const LAN_ADDRESS = '192.168.1.20';

export function mockBaseUrl(target) {
  const known = ['android-emulator', 'ios-simulator', 'android-usb', 'phone-wifi'];
  if (!known.includes(target)) throw new Error(`Unknown target: ${target}`);
  return `http://localhost:${MOCK_PORT}`; // it works in the browser on my computer
}
