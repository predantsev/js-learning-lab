// Development config of the expenses app: where the mock service is for each target.
export const MOCK_PORT = 7310;
export const LAN_ADDRESS = '192.168.1.20';

const HOSTS = {
  'android-emulator': '10.0.2.2',
  'ios-simulator': '127.0.0.1',
  'android-usb': '127.0.0.1', // after adb reverse tcp:7310 tcp:7310
  'phone-wifi': LAN_ADDRESS,
};

export function mockBaseUrl(target) {
  if (!(target in HOSTS)) throw new Error(`Unknown target: ${target}`);
  return `http://${HOSTS[target]}:${MOCK_PORT}`;
}
