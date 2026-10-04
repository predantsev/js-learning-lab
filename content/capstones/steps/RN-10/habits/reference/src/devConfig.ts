// Where the course's mock service is, seen from the declared target. The address is decided here and
// only here: no request of the app contains a host. This is development configuration — a release build
// would talk to a real HTTPS service, not to a computer on the local network.

export type Target = "android-emulator" | "ios-simulator" | "android-usb" | "lan";

// Set it to your declared target (~/js-course/native-target.md).
export const TARGET: Target = "android-emulator";

export const MOCK_PORT = 7310;

// For a phone on the same Wi-Fi: the "LAN address" that `node tools/mock-service.mjs --host 0.0.0.0`
// prints on your computer.
export const LAN_ADDRESS = "192.168.1.20";

// Failure switches of the mock service for a rehearsal on the device, for example "fail=2&key=r1",
// "hang=1", "invalid=1" or "status=503". Empty for a normal run; keep it empty in a commit.
export const REHEARSAL = "";

// Measuring a long list: with a count above 0 the app starts with that many synthetic records
// (data/synthetic.js) in a memory storage, so the saved records are neither read nor overwritten, and
// the list shows a measure button. 0 for a normal run; keep it 0 in a commit.
export const SYNTHETIC_COUNT = 0;

// The Android emulator reaches the computer at 10.0.2.2; the iOS simulator shares the computer's
// network, so 127.0.0.1 is the computer; an Android phone on USB reaches it at 127.0.0.1 after
// `adb reverse tcp:7310 tcp:7310`; a phone on Wi-Fi needs the computer's LAN address.
const HOST_BY_TARGET: Record<Target, string> = {
  "android-emulator": "10.0.2.2",
  "ios-simulator": "127.0.0.1",
  "android-usb": "127.0.0.1",
  lan: LAN_ADDRESS,
};

export function mockBaseUrl(target: Target): string {
  const host = HOST_BY_TARGET[target];
  if (host === undefined) {
    throw new Error("Unknown target: " + target);
  }
  return "http://" + host + ":" + MOCK_PORT;
}
