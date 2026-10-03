// SIMULATED networks of the four targets. The preview has no emulator or phone, so this module
// decides whether a request would reach the mock service on your computer, following the Android
// emulator networking documentation (10.0.2.2 = the computer's loopback) and the routes in the lesson.
// The mock service listens on the computer's loopback (127.0.0.1) unless `lan` is true.
export const TARGETS = ['android-emulator', 'ios-simulator', 'android-usb', 'phone-wifi'];
export const LAN = '192.168.1.20'; // the computer's address in the Wi-Fi network (an example)

export function reaches(target, url, { reversed = false, lan = false } = {}) {
  const host = new URL(url).hostname;
  if (host === LAN) return lan; // anyone in the network, but only if the service listens there
  if (host === '10.0.2.2') return target === 'android-emulator';
  if (host === 'localhost' || host === '127.0.0.1') {
    if (target === 'ios-simulator') return true; // the simulator shares the computer's network
    if (target === 'android-emulator' || target === 'android-usb') return reversed; // its own loopback, unless adb reverse
    return false; // a phone's own loopback
  }
  return false;
}

// A fetch as `target` would see it: the records, or the error React Native's fetch gives.
export function fetchFrom(target, options = {}) {
  return async (url) => {
    await new Promise((resolve) => setTimeout(resolve, 30));
    if (!reaches(target, url, options)) throw new TypeError('Network request failed');
    return new Response(JSON.stringify(options.records ?? []), { status: 200, headers: { 'content-type': 'application/json' } });
  };
}
