// Development config: where the mock service runs and how each target reaches it.
export const MOCK_PORT = 7310;
export const LAN_ADDRESS = '192.168.1.20'; // the computer's address in the Wi-Fi network

const HOST_BY_TARGET = {
  'android-emulator': '10.0.2.2', // the emulator's alias for the computer's loopback
  'ios-simulator': '127.0.0.1', // the simulator shares the computer's network
  'android-usb': '127.0.0.1', // adb reverse forwards the phone's port to the computer
  'phone-wifi': LAN_ADDRESS, // the service must listen on the network, not only on loopback
};

export function mockBaseUrl(target) {
  const host = HOST_BY_TARGET[target];
  if (host === undefined) throw new Error(`Unknown target: ${target}`);
  return `http://${host}:${MOCK_PORT}`;
}
